import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Bell, CheckCircle2, Eye, EyeOff, Lock, Shield, ShieldCheck, Trash2, User } from "lucide-react-native";
import { router } from "expo-router";
import { C, F } from "../../constants/tokens";
import { useAuth } from "../../context/AuthContext";
import { deleteAdminAccount, getAdminSettings, updateAdminNotifications, updateAdminPassword, updateAdminPrivacy } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

type Tab = "account" | "security" | "notifications" | "privacy";
type Notifications = { new_student_registration:boolean; new_company_registration:boolean; job_pending_approval:boolean; abuse_reports:boolean; system_alerts:boolean; admin_messages:boolean };
const defaults: Notifications = { new_student_registration:true, new_company_registration:true, job_pending_approval:true, abuse_reports:true, system_alerts:true, admin_messages:true };
const tabs = [{key:"account" as Tab,label:"Account",icon:User},{key:"security" as Tab,label:"Security",icon:Lock},{key:"notifications" as Tab,label:"Notifications",icon:Bell},{key:"privacy" as Tab,label:"Privacy",icon:Shield}];
const notificationRows: {key:keyof Notifications;title:string;description:string}[] = [
  {key:"new_student_registration",title:"New Student Registration",description:"Notify me when a new student joins the platform"},
  {key:"new_company_registration",title:"New Company Registration",description:"Notify me when a company registers for review"},
  {key:"job_pending_approval",title:"Job Pending Approval",description:"Alert me when a job requires moderation"},
  {key:"abuse_reports",title:"Abuse Reports",description:"Notify me about new abuse and safety reports"},
  {key:"system_alerts",title:"System Alerts",description:"Receive important platform and security alerts"},
  {key:"admin_messages",title:"Admin Messages",description:"Receive messages addressed to administrators"},
];

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const [tab,setTab]=useState<Tab>("account"), [loading,setLoading]=useState(true), [saving,setSaving]=useState(false), [saved,setSaved]=useState(false);
  const [profile,setProfile]=useState({name:user?.name??"",email:user?.email??""});
  const [accountStatus,setAccountStatus]=useState("Active");
  const [password,setPassword]=useState({current_password:"",password:"",password_confirmation:""});
  const [notifications,setNotifications]=useState<Notifications>(defaults);
  const [profileVisibility,setProfileVisibility]=useState(false);

  const loadSettings=useCallback(async()=>{try{const response=await getAdminSettings();const data=response?.data??response;if(data?.account){setProfile({name:data.account.name??user?.name??"",email:data.account.email??user?.email??""});setAccountStatus(data.account.status??"Active")}if(data?.notifications)setNotifications({...defaults,...data.notifications});setProfileVisibility(Boolean(data?.privacy?.profile_visibility))}catch(e:any){if(e?.response?.status!==404)console.warn("Failed to load admin settings:",e?.response?.data?.message??e?.message)}finally{setLoading(false)}},[user?.email,user?.name]);
  useSyncRefresh("admin", loadSettings);
  useEffect(()=>{void loadSettings()},[loadSettings]);
  const flash=()=>{setSaved(true);setTimeout(()=>setSaved(false),1800)};
  const savePassword=async()=>{if(!password.current_password||!password.password)return Alert.alert("Missing information","Enter your current and new password.");if(password.password.length<8)return Alert.alert("Password too short","Use at least 8 characters.");if(password.password!==password.password_confirmation)return Alert.alert("Passwords do not match","Confirm the same new password.");try{setSaving(true);await updateAdminPassword(password);setPassword({current_password:"",password:"",password_confirmation:""});flash();Alert.alert("Password updated","Your password was changed successfully.")}catch(e:any){Alert.alert("Could not update password",e?.response?.data?.message??"Please try again.")}finally{setSaving(false)}};
  const toggle=async(key:keyof Notifications,value:boolean)=>{const previous=notifications;setNotifications({...notifications,[key]:value});try{await updateAdminNotifications({[key]:value});flash()}catch{setNotifications(previous);Alert.alert("Could not save","Please try again.")}};
  const toggleVisibility=async()=>{const previous=profileVisibility;const value=!previous;setProfileVisibility(value);try{await updateAdminPrivacy({profile_visibility:value});flash()}catch{setProfileVisibility(previous);Alert.alert("Could not save","Please try again.")}};
  const deleteAccount = () =>
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. Are you sure you want to delete your administrator account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAdminAccount();
              await logout();
              router.replace("/(auth)/login" as any);
            } catch (e: any) {
              Alert.alert(
                "Could not delete account",
                e?.response?.data?.message ?? "Please try again.",
              );
            }
          },
        },
      ],
    );

  return <View style={s.root}>
    <View style={s.header}><View><Text style={s.title}>Settings</Text><Text style={s.subtitle}>Manage your admin account</Text></View>{saved&&<View style={s.saved}><CheckCircle2 size={14} color={C.success}/><Text style={s.savedText}>Saved</Text></View>}</View>
    <View style={s.tabs}>{tabs.map(({key,label,icon:Icon})=><Pressable key={key} onPress={()=>setTab(key)} style={[s.tab,tab===key&&s.tabOn]}><Icon size={16} color={tab===key?C.accent:C.textSec}/><Text style={[s.tabText,tab===key&&s.tabTextOn]}>{label}</Text></Pressable>)}</View>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {loading?<View style={s.loading}><ActivityIndicator color={C.accent}/><Text style={s.loadingText}>Loading settings...</Text></View>:<>
        {tab==="account"&&<View><Section title="Account" subtitle="Your administrator account information"/><Field label="Full Name" value={profile.name} editable={false}/><Field label="Email Address" value={profile.email} editable={false} keyboardType="email-address"/><Field label="Role" value="Administrator" editable={false}/><View style={s.field}><Text style={s.label}>Account Status</Text><View style={s.statusField}><View style={s.statusBadge}><Text style={s.statusText}>{accountStatus}</Text></View></View></View><View style={s.infoBox}><Text style={s.infoText}>Your administrator account information is managed by the platform.</Text></View></View>}
        {tab==="security"&&<View><Section title="Security" subtitle="Manage your password and account security"/><Field label="Current Password" value={password.current_password} onChangeText={current_password=>setPassword({...password,current_password})} secureTextEntry/><Field label="New Password" value={password.password} onChangeText={value=>setPassword({...password,password:value})} secureTextEntry/><Field label="Confirm Password" value={password.password_confirmation} onChangeText={password_confirmation=>setPassword({...password,password_confirmation})} secureTextEntry/><Button title={saving?"Updating...":"Update Password"} icon={Lock} onPress={savePassword} disabled={saving}/><View style={s.securityCard}><View style={s.noteIcon}><ShieldCheck size={18} color={C.accent}/></View><View style={s.noteCopy}><Text style={s.noteTitle}>Two-Factor Authentication</Text><Text style={s.noteText}>Add extra security to your administrator account</Text></View><View style={s.soonBadge}><Text style={s.soonText}>Soon</Text></View></View></View>}
        {tab==="notifications"&&<View><Section title="Notification Preferences" subtitle="Choose which notifications you want to receive"/>{notificationRows.map((row,index)=><View key={row.key} style={[s.settingRow,index<notificationRows.length-1&&s.divider]}><View style={s.settingCopy}><Text style={s.settingTitle}>{row.title}</Text><Text style={s.settingDescription}>{row.description}</Text></View><Toggle value={notifications[row.key]} onPress={()=>toggle(row.key,!notifications[row.key])}/></View>)}</View>}
        {tab==="privacy"&&<View><Section title="Privacy & Data" subtitle="Control your administrator profile and account data"/><View style={s.settingRow}><View style={s.settingCopy}><Text style={s.settingTitle}>Profile Visibility</Text><Text style={s.settingDescription}>Control whether your administrator profile is visible to other administrators</Text></View><Toggle value={profileVisibility} onPress={toggleVisibility}/></View><View style={s.dangerSection}><View style={s.dangerTitleRow}><Trash2 size={18} color={C.error}/><Text style={s.dangerTitle}>Danger Zone</Text></View><Text style={s.dangerText}>Deleting your administrator account is permanent and cannot be undone.</Text><Pressable style={s.deleteButton} onPress={deleteAccount}><Trash2 size={16} color="#FFF"/><Text style={s.deleteButtonText}>Delete Account</Text></Pressable></View></View>}
      </>}
    </ScrollView>
  </View>;
}

function Section({title,subtitle}:{title:string;subtitle:string}){return <View style={s.sectionHead}><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionSubtitle}>{subtitle}</Text></View>}
function Field({label,...props}:{label:string;value:string;onChangeText?:(v:string)=>void;editable?:boolean;secureTextEntry?:boolean;keyboardType?:"email-address"}){const [visible,setVisible]=useState(false);return <View style={s.field}><Text style={s.label}>{label}</Text><View style={s.inputWrap}><TextInput {...props} secureTextEntry={props.secureTextEntry&&!visible} placeholderTextColor={C.textMuted} autoCapitalize={props.keyboardType?"none":"sentences"} style={[s.input,props.secureTextEntry&&s.passwordInput,props.editable===false&&s.inputOff]}/>{props.secureTextEntry&&<Pressable onPress={()=>setVisible(value=>!value)} style={s.eye}>{visible?<EyeOff size={18} color={C.textSec}/>:<Eye size={18} color={C.textSec}/>}</Pressable>}</View></View>}
function Button({title,icon:Icon,onPress,disabled}:{title:string;icon:any;onPress:()=>void;disabled:boolean}){return <Pressable onPress={onPress} disabled={disabled} style={({pressed})=>[s.button,{opacity:disabled?.55:pressed?.75:1}]}><Icon size={16} color="#FFF"/><Text style={s.buttonText}>{title}</Text></Pressable>}
function Toggle({value,onPress}:{value:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={[s.toggle,{backgroundColor:value?C.accent:"#D1D5DB"}]}><View style={[s.toggleThumb,{transform:[{translateX:value?20:2}]}]}/></Pressable>}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},header:{paddingHorizontal:18,paddingTop:18,paddingBottom:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},title:{fontFamily:F,fontSize:24,fontWeight:"900",color:C.text},subtitle:{fontFamily:F,fontSize:12,color:C.textSec,marginTop:4},saved:{flexDirection:"row",alignItems:"center",gap:5,paddingHorizontal:10,paddingVertical:7,borderRadius:10,backgroundColor:C.successBg},savedText:{fontFamily:F,fontSize:11,fontWeight:"700",color:C.success},
  tabs:{paddingHorizontal:18,paddingBottom:14,flexDirection:"row",flexWrap:"wrap",gap:8},tab:{width:"48%",flexGrow:1,minHeight:46,borderRadius:12,borderWidth:1,borderColor:C.border,backgroundColor:C.surface,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6},tabOn:{backgroundColor:C.accentLight,borderColor:C.accentLight},tabText:{fontFamily:F,fontSize:12,fontWeight:"500",color:C.textSec},tabTextOn:{fontWeight:"700",color:C.accent},scroll:{flex:1,marginHorizontal:18,marginBottom:14,borderRadius:18,borderWidth:1,borderColor:C.border,backgroundColor:C.surface},content:{paddingHorizontal:16,paddingTop:20,paddingBottom:28},loading:{minHeight:280,alignItems:"center",justifyContent:"center",gap:9},loadingText:{fontFamily:F,fontSize:12,color:C.textSec},
  sectionHead:{marginBottom:19},sectionTitle:{fontFamily:F,fontSize:18,fontWeight:"800",color:C.text},sectionSubtitle:{fontFamily:F,fontSize:12,color:C.textSec,marginTop:4},profile:{flexDirection:"row",alignItems:"center",padding:14,borderRadius:14,backgroundColor:C.bg,borderWidth:1,borderColor:C.border,marginBottom:18},avatar:{width:52,height:52,borderRadius:15,backgroundColor:C.accent,alignItems:"center",justifyContent:"center",marginRight:12},avatarText:{fontFamily:F,fontSize:20,fontWeight:"900",color:"#FFF"},profileCopy:{flex:1},profileName:{fontFamily:F,fontSize:15,fontWeight:"800",color:C.text},profileEmail:{fontFamily:F,fontSize:11,color:C.textSec,marginTop:3},role:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:4,marginTop:7,paddingHorizontal:7,height:24,borderRadius:7,backgroundColor:C.accentLight},roleText:{fontFamily:F,fontSize:8,fontWeight:"800",color:C.accentHover},
  field:{marginBottom:14},label:{fontFamily:F,fontSize:12,fontWeight:"700",color:C.text,marginBottom:7},inputWrap:{position:"relative"},input:{height:46,width:"100%",borderWidth:1,borderColor:C.border,borderRadius:11,backgroundColor:C.surface,paddingHorizontal:13,fontFamily:F,fontSize:13,color:C.text},passwordInput:{paddingRight:46},eye:{position:"absolute",right:5,top:5,width:36,height:36,alignItems:"center",justifyContent:"center"},inputOff:{backgroundColor:C.bg,color:C.textSec},button:{height:43,alignSelf:"flex-start",paddingHorizontal:15,borderRadius:10,backgroundColor:C.accent,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7},buttonText:{fontFamily:F,fontSize:12,fontWeight:"800",color:"#FFF"},
  statusField:{minHeight:45,borderRadius:11,borderWidth:1,borderColor:C.border,backgroundColor:C.surface,justifyContent:"center",paddingHorizontal:13},statusBadge:{alignSelf:"flex-start",paddingHorizontal:10,paddingVertical:5,borderRadius:99,backgroundColor:C.successBg},statusText:{fontFamily:F,fontSize:11,fontWeight:"800",color:C.success},securityCard:{marginTop:25,padding:15,borderRadius:14,borderWidth:1,borderColor:C.border,backgroundColor:C.surface,flexDirection:"row",alignItems:"center"},noteIcon:{width:38,height:38,borderRadius:10,backgroundColor:C.accentLight,alignItems:"center",justifyContent:"center",marginRight:11},noteCopy:{flex:1,paddingRight:8},noteTitle:{fontFamily:F,fontSize:13,fontWeight:"700",color:C.text},noteText:{fontFamily:F,fontSize:11,lineHeight:16,color:C.textSec,marginTop:3},soonBadge:{paddingHorizontal:9,paddingVertical:6,borderRadius:8,backgroundColor:C.bg,borderWidth:1,borderColor:C.border},soonText:{fontFamily:F,fontSize:10,fontWeight:"700",color:C.textMuted},settingRow:{minHeight:78,paddingVertical:15,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},divider:{borderBottomWidth:1,borderBottomColor:C.divider},settingCopy:{flex:1,paddingRight:8},settingTitle:{fontFamily:F,fontSize:13,fontWeight:"700",color:C.text},settingDescription:{fontFamily:F,fontSize:11,lineHeight:16,color:C.textSec,marginTop:4},toggle:{width:44,height:25,borderRadius:20,justifyContent:"center",flexShrink:0},toggleThumb:{width:21,height:21,borderRadius:20,backgroundColor:"#FFF",shadowColor:"#000",shadowOpacity:.15,shadowRadius:3,shadowOffset:{width:0,height:1},elevation:2},
  infoBox:{marginTop:18,padding:13,borderRadius:11,backgroundColor:C.accentLight,borderWidth:1,borderColor:C.accentLight},infoText:{fontFamily:F,fontSize:12,lineHeight:18,color:C.textSec},dangerSection:{marginTop:14,paddingTop:22,borderTopWidth:1,borderTopColor:C.divider},dangerTitleRow:{flexDirection:"row",alignItems:"center",gap:7,marginBottom:7},dangerTitle:{fontFamily:F,fontSize:14,fontWeight:"800",color:C.error},dangerText:{fontFamily:F,fontSize:11,lineHeight:17,color:C.textSec,marginBottom:13},deleteButton:{minHeight:43,alignSelf:"flex-start",paddingHorizontal:15,borderRadius:10,backgroundColor:C.error,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7},deleteButtonText:{fontFamily:F,fontSize:12,fontWeight:"800",color:"#FFF"}
});
