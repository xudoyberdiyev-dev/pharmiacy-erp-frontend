import { LogOut, User, Shield, Phone } from "lucide-react";
import { useAuth } from "../layout/AuthProvider";

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="empDash">
      <div className="empDashCard">
        <div className="empDashAvatar">
          {`${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || <User size={28} />}
        </div>
        <h2 className="empDashName">{user?.firstName} {user?.lastName}</h2>
        <span className={`empDashRole role-${user?.role}`}>{user?.role}</span>

        <div className="empDashInfo">
          {user?.phone && (
            <div className="empDashRow">
              <Phone size={15} />
              <span>{user.phone}</span>
            </div>
          )}
          <div className="empDashRow">
            <Shield size={15} />
            <span>Xodim sifatida kirgansiz</span>
          </div>
        </div>

        <div className="empDashDivider" />

        <p className="empDashMsg">
          Tizimga muvaffaqiyatli kirdingiz. Bu sahifa kelajakda xodimlar uchun 
          maxsus funksiyalar bilan to'ldiriladi.
        </p>

        <button className="logoutBtn" onClick={logout}>
          <LogOut size={16} /> Chiqish
        </button>
      </div>
    </div>
  );
}