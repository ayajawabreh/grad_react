import { useNavigate } from "react-router";
import { CompanySettingsView } from "../../components/shared/CompanySettingsView";
import { useAuth } from "../../context/AuthContext";

export default function CompanySettings() {
  const { logout, user } = useAuth();
  const nav = useNavigate();

  const company = user?.company;

  return (
    <CompanySettingsView
      name={company?.name || user?.name || ""}
      email={user?.email || ""}
      accountStatus={company?.status === "approved" ? "approved" : "pending"}
      verified={Boolean(company?.is_verified)}
      onLogout={() => {
        logout();
        nav("/login");
      }}
    />
  );
}