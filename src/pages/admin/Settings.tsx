import { useNavigate } from "react-router";
import { SettingsView } from "../../components/shared/SettingsView";
import { useAuth } from "../../context/AuthContext";

export default function AdminSettings() {
  const { logout } = useAuth();
  const nav = useNavigate();

  return (
    <SettingsView
      name="Admin"
      email="admin@careerbridge.io"
      role="admin"
      onLogout={() => { logout(); nav("/login"); }}
    />
  );
}
