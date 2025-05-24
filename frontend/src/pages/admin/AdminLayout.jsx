import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const AdminLayout = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
