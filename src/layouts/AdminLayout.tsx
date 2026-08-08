import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  User,
  Building2,
  Briefcase,
  BarChart2,
  Bell,
  Settings,
  LogOut,
  Shield,
  Search,
  Layers,
  Wrench
} from "lucide-react";
import { C, F } from "../constants/tokens";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  null,
  { to: "/admin/students", icon: User, label: "Students" },
  { to: "/admin/companies", icon: Building2, label: "Companies" },
  { to: "/admin/pending", icon: Shield, label: "Pending Companies" },
  { to: "/admin/jobs", icon: Briefcase, label: "Jobs" },
  null,
  { to: "/admin/categories", icon: Layers, label: "Categories" },
  { to: "/admin/skills", icon: Wrench, label: "Skills" },
  null,
  { to: "/admin/analytics", icon: BarChart2, label: "Reports & Analytics" },
  { to: "/admin/notifications", icon: Bell, label: "Notifications", badge: 14 },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout() {
  const { role, logout } = useAuth();
  const nav = useNavigate();

  if (role !== "admin") {
    nav("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: C.bg,
        fontFamily: F,
      }}
    >

      {/* Sidebar */}
      <div
        style={{
          width: 256,
          flexShrink: 0,
          background: C.darker,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: "100vh",
        }}
      >

        {/* Logo */}
        <div
          style={{
            padding: "18px 18px 14px",
            borderBottom: "1px solid #2E2E38",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: C.error,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={18} color="#fff" />
            </div>

            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#E8E8EC",
                  margin: 0,
                }}
              >
                Admin Portal
              </p>

              <p
                style={{
                  fontSize: 11,
                  color: "#9090A0",
                  margin: 0,
                }}
              >
                CareerBridge Platform
              </p>
            </div>
          </div>
        </div>


        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            overflow: "auto",
            padding: "12px 10px",
          }}
        >
          {NAV.map((item, i) => {

            if (!item)
              return (
                <div
                  key={i}
                  style={{
                    height: 1,
                    background: "#2E2E38",
                    margin: "6px 8px",
                  }}
                />
              );


            const {to, icon: Icon, label, badge} = item as any;


            return (
              <NavLink
                key={to}
                to={to}
                style={({isActive}) => ({
                  display:"flex",
                  alignItems:"center",
                  gap:10,
                  padding:"9px 12px",
                  borderRadius:10,
                  textDecoration:"none",
                  background:isActive ? `${C.error}20` : "transparent",
                  color:isActive ? C.error : "#9090A0",
                  fontSize:13,
                  marginBottom:2,
                })}
              >
                <Icon size={16}/>
                <span style={{flex:1}}>
                  {label}
                </span>

                {badge && (
                  <span
                    style={{
                      minWidth:20,
                      height:18,
                      borderRadius:9,
                      background:C.error,
                      color:"#fff",
                      fontSize:10,
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center"
                    }}
                  >
                    {badge}
                  </span>
                )}

              </NavLink>
            );
          })}
        </nav>


        <div
          style={{
            padding:"10px 10px 16px",
            borderTop:"1px solid #2E2E38"
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width:"100%",
              display:"flex",
              alignItems:"center",
              gap:10,
              padding:"9px 12px",
              borderRadius:10,
              border:"none",
              cursor:"pointer",
              background:"transparent",
              color:C.error,
            }}
          >
            <LogOut size={16}/>
            Sign Out
          </button>
        </div>

      </div>



      {/* Main */}
      <div
        style={{
          flex:1,
          display:"flex",
          flexDirection:"column",
          overflow:"hidden",
          minWidth:0
        }}
      >

        {/* Top Bar */}
        <div
          style={{
            height:60,
            background:C.darker,
            borderBottom:"1px solid #2E2E38",
            display:"flex",
            alignItems:"center",
            gap:16,
            padding:"0 28px",
          }}
        >

          <div style={{flex:1}}>
            <div
              style={{
                display:"flex",
                alignItems:"center",
                gap:8,
                padding:"8px 14px",
                borderRadius:12,
                background:"#ffffff08",
                border:"1px solid #2E2E38"
              }}
            >
              <Search size={14} color="#9090A0"/>

              <input
                placeholder="Search platform..."
                style={{
                  flex:1,
                  border:"none",
                  outline:"none",
                  background:"transparent",
                  color:"#fff"
                }}
              />
            </div>
          </div>


          <div
            style={{
              display:"flex",
              alignItems:"center",
              gap:10
            }}
          >
            <Shield size={18} color="#fff"/>
            <span style={{color:"#fff",fontSize:13}}>
              Admin
            </span>
          </div>

        </div>


        <main
          style={{
            flex:1,
            overflow:"auto",
            padding: 32,
            background:C.bg
          }}
        >
          <div style={{maxWidth:1200,margin:"0 auto"}}>
            <Outlet/>
          </div>
        </main>


      </div>

    </div>
  );
}