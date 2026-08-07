import { useNavigate } from "react-router";
import { SettingsView } from "../../components/shared/SettingsView";
import { useAuth } from "../../context/AuthContext";

export default function StudentSettings() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <SettingsView
  name={user?.name || ""}
  email={user?.email || ""}
  phone={user?.phone || ""}
  location={user?.location || ""}
  role="student"
  onLogout={() => { 
    logout(); 
    nav("/login"); 
  }}
/>
  );
}