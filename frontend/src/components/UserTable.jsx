import React from "react";

const UserTable = ({ users, toggleStatus }) => {
  return (
    <table className="w-full bg-white shadow-md rounded-md">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-3 text-left">Name</th>
          <th className="p-3 text-left">Email</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b">
            <td className="p-3">{user.name}</td>
            <td className="p-3">{user.email}</td>
            <td className="p-3">
              <span className={`px-2 py-1 rounded text-white ${user.status === "active" ? "bg-green-500" : "bg-red-500"}`}>
                {user.status}
              </span>
            </td>
            <td className="p-3">
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                onClick={() => toggleStatus(user.id)}
              >
                {user.status === "active" ? "Suspend" : "Activate"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserTable;
