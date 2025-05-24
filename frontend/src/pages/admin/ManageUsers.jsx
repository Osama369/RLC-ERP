import React, { useState } from "react";
import UserTable from "../../components/UserTable";

const ManageUsers = () => {
  const [users, setUsers] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", status: "active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", status: "suspended" },
  ]);

  const toggleStatus = (id) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, status: user.status === "active" ? "suspended" : "active" } : user
    ));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
      <UserTable users={users} toggleStatus={toggleStatus} />
    </div>
  );
};

export default ManageUsers;
