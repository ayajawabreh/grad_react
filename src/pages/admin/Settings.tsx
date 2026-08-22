import { useNavigate } from "react-router";
import { SettingsView } from "../../components/shared/SettingsView";
import { useAuth } from "../../context/AuthContext";

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <SettingsView
      name={user?.name || ""}
      email={user?.email || ""}
      role="admin"
      onLogout={() => {
        logout();
        nav("/login");
      }}
    />
  );
}
