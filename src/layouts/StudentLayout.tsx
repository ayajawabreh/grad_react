import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard, User, FileText, Search, BookmarkCheck, Sparkles,
  ClipboardList, MessageSquare, Bell, Settings, LogOut, Bot, Menu, X
} from "lucide-react";
import { C, F } from "../constants/tokens";
import { useAuth } from "../context/AuthContext";
import { API } from "../imports/api";

const NAV = [
  { to: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/student/profile", icon: User, label: "Profile" },
  { to: "/student/resume", icon: FileText, label: "Resume Builder" },
  null,
  { to: "/student/jobs", icon: Search, label: "Browse Jobs" },
  { to: "/student/saved", icon: BookmarkCheck, label: "Saved Jobs" },
  { to: "/student/recommended", icon: Sparkles, label: "Suggested Jobs", badge: 5 },
  { to: "/student/applications", icon: ClipboardList, label: "Applications", badge: 3 },
  null,
  { to: "/student/messages", icon: MessageSquare, label: "Messages", badge: 2 },
  { to: "/student/notifications", icon: Bell, label: "Notifications", badge: 5 },
  { to: "/student/ai", icon: Bot, label: "AI Assistant" },
  null,
  { to: "/student/settings", icon: Settings, label: "Settings" },
];


function Sidebar({ student, onClose }: { student: any; onClose?: () => void }) {

  const { logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/login");
    onClose?.();
  };


  return (
    <>
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>

          <div style={{
            width:36,
            height:36,
            borderRadius:10,
            overflow:"hidden"
          }}>
            <img
              src={
                student?.avatar ||
                `https://ui-avatars.com/api/?name=${student?.name || "User"}`
              }
              alt="Avatar"
              style={{
                width:"100%",
                height:"100%",
                objectFit:"cover"
              }}
            />
          </div>


          <div>
            <p style={{
              fontSize:13,
              fontWeight:700,
              color:C.text,
              margin:0,
              fontFamily:F
            }}>
              {student?.name || "Student"}
            </p>

            <p style={{
              fontSize:11,
              color:C.textSec,
              margin:0,
              fontFamily:F
            }}>
              {student?.univ || ""}
            </p>
          </div>

        </div>


        {onClose &&
          <button
            onClick={onClose}
            style={{
              background:"none",
              border:"none",
              cursor:"pointer",
              color:C.textMuted
            }}
          >
            <X size={16}/>
          </button>
        }

      </div>



      <nav style={{
        flex:1,
        overflow:"auto",
        padding:"12px 10px"
      }}>

        {NAV.map((item,i)=>{

          if(!item)
            return (
              <div
                key={i}
                style={{
                  height:1,
                  background:C.divider,
                  margin:"6px 8px"
                }}
              />
            );


          const {to,icon:Icon,label,badge}=item as any;


          return (

            <NavLink
              key={to}
              to={to}
              end={to==="/student/dashboard"}
              onClick={onClose}

              style={({isActive})=>({
                display:"flex",
                alignItems:"center",
                gap:10,
                padding:"9px 12px",
                borderRadius:12,
                textDecoration:"none",
                background:isActive ? C.accentLight:"transparent",
                color:isActive ? C.accent:C.textSec,
                fontFamily:F,
                fontSize:13,
                fontWeight:isActive ? 600:400,
                marginBottom:2
              })}
            >

              <Icon size={16}/>

              <span style={{flex:1}}>
                {label}
              </span>


              {badge &&
                <span style={{
                  minWidth:20,
                  height:18,
                  padding:"0 5px",
                  borderRadius:9,
                  background:C.accent,
                  color:"#fff",
                  fontSize:10,
                  fontWeight:700,
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center"
                }}>
                  {badge}
                </span>
              }

            </NavLink>

          );

        })}

      </nav>



      <div style={{
        padding:"10px 10px 16px",
        borderTop:`1px solid ${C.border}`
      }}>

        <button
          onClick={handleLogout}
          style={{
            width:"100%",
            display:"flex",
            alignItems:"center",
            gap:10,
            padding:"9px 12px",
            borderRadius:12,
            border:"none",
            cursor:"pointer",
            background:"transparent",
            color:C.error,
            fontFamily:F,
            fontSize:13
          }}
        >

          <LogOut size={16}/>
          Sign Out

        </button>

      </div>

    </>
  );
}




function TopBar({student}:{student:any}) {


return (

<div style={{
height:60,
background:C.surface,
borderBottom:`1px solid ${C.border}`,
display:"flex",
alignItems:"center",
padding:"0 28px"
}}>


<div style={{flex:1}}>

<div style={{
display:"flex",
alignItems:"center",
gap:8,
padding:"8px 14px",
borderRadius:12,
background:C.bg,
border:`1px solid ${C.border}`,
maxWidth:400
}}>

<Search size={14}/>

<input
placeholder="Search jobs, companies..."
style={{
border:"none",
outline:"none",
background:"transparent",
fontFamily:F
}}
/>

</div>

</div>



<NavLink
to="/student/profile"
style={{
display:"flex",
alignItems:"center",
gap:8,
textDecoration:"none"
}}
>


<img
src={
student?.avatar ||
`https://ui-avatars.com/api/?name=${student?.name}`
}
style={{
width:32,
height:32,
borderRadius:10,
objectFit:"cover"
}}
/>


<div>

<p style={{
margin:0,
fontSize:12,
fontWeight:600,
color:C.text
}}>
{student?.name}
</p>


<p style={{
margin:0,
fontSize:11,
color:C.textSec
}}>
Student
</p>


</div>


</NavLink>


</div>

)

}





export default function StudentLayout(){

const [sidebarOpen,setSidebarOpen]=useState(false);

const [student,setStudent]=useState<any>(null);


const {role}=useAuth();

const nav=useNavigate();



useEffect(()=>{

API.get("/student/profile")
.then(res=>{
setStudent(res.data);
})
.catch(err=>{
console.log(err);
});

},[]);



if(role!=="student"){
nav("/login");
return null;
}



return (

<div style={{
display:"flex",
height:"100vh",
overflow:"hidden",
background:C.bg,
fontFamily:F
}}>


<div
  style={{
    width:256,
    background:C.surface,
    borderRight:`1px solid ${C.border}`,
    flexDirection:"column",
    flexShrink:0,
    display:"flex"
  }}
>
  <Sidebar student={student}/>
</div>



<div style={{
flex:1,
display:"flex",
flexDirection:"column"
}}>


<TopBar student={student}/>



<main style={{
flex:1,
overflow:"auto",
padding:32,
background:C.bg
}}>

<div style={{
maxWidth:1200,
margin:"auto"
}}>

<Outlet/>

</div>


</main>


</div>


</div>

)

}