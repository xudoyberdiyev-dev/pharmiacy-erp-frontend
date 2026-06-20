import "./mainLayout.css";
import Header from "../components/Hader";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="layout">
      <Header />
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}