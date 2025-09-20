import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from "axios";
// import jsPDF from "jspdf";
// import { useSelector, useDispatch } from "react-redux";
// import { showLoading, hideLoading } from '../redux/features/alertSlice';
// import { setUser } from '../redux/features/userSlice';
// imort the FaSignOutAlt
import { FaFile, FaSignOutAlt } from 'react-icons/fa';
// import { setData } from '../redux/features/dataSlice';
import { toast } from "react-toastify";
import Center from './Center';
import DistributerUsers from '../pages/distributor/DistributerUsers';
import DistributorCreateUser from '../pages/distributor/DistributorCreateUser';
import DistributorEditUser from '../pages/distributor/DistributorEditUser'; // Import the edit user component
import Spinner from '../components/Spinner'
import "jspdf-autotable";
import {
  FaBook,
  FaCalculator,
  FaInbox,
  FaDice,
  FaUsers,
  FaUserPlus,
  FaFileAlt,
  FaUserEdit, // Import icon for editing users
} from 'react-icons/fa';
import RoleBasedComponent from './RoleBasedRoute';
import { Link } from 'react-router-dom';
import Reports from './Reports';
const Layout = () => {
  // Hooks to manage states of the variables
  // State for ledger selection, date, and draw time
  //const [user, setUser] = useState(null);
  // using the redux slice reducer

  // const dispatch = useDispatch();
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState("");
   const navigate = useNavigate();
  // const userData = useSelector((state) => state.user);
  // const token = userData?.token || localStorage.getItem("token");
  // console.log(token);


  // const [ledger, setLedger] = useState("LEDGER");
  // const [drawTime, setDrawTime] = useState("11 AM");  // time slot
  // const [drawDate, setDrawDate] = useState(new Date().toISOString().split('T')[0]); // date
  // const [closingTime, setClosingTime] = useState("");
  // const [entries, setEntries] = useState([]);  // table entries
  // const [no, setNo] = useState('');
  // const [f, setF] = useState('');
  // const [s, setS] = useState('');
  // const [selectAll, setSelectAll] = useState(false);
  // const [currentTime, setCurrentTime] = useState(new Date());
  // const [file, setFile] = useState(null);
  
   
//    // logout th user 
//    // utils/auth.js (or inside any component)

const handleLogout = (navigate) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user"); // if you're storing user info
  // Optionally show a toast
  toast.success("Logged out successfully!");
  // Navigate to login
  navigate("/login");
};


 
  const [activeTab, setActiveTab] = useState("book");
  const [selectedUserId, setSelectedUserId] = useState(null); // Add state for selected user ID


  return (
    <div className="flex h-screen min-h-[500px] bg-gray-900 text-gray-100 overflow-hidden">

    {/* Sidebar */}
    <div className="w-64 bg-gray-800 flex flex-col p-5 border-r border-gray-700">
      <div className="text-2xl font-bold mb-6 flex items-center gap-2 text-purple-400">
        <FaDice className="text-3xl" />
        <span>Dealer Portal</span>
      </div>

      <nav className="flex flex-col space-y-3">
        <button
          onClick={() => setActiveTab("book")}
          className={`flex items-center px-3 py-2.5 rounded-md gap-2 transition-colors ${
            activeTab === "book" ? "bg-gray-700" : "hover:bg-gray-700"
          }`}
        >
          <FaBook className="text-purple-400" />
          Book
        </button>

        <button
          onClick={() => setActiveTab("hisab")}
          className={`flex items-center px-3 py-2.5 rounded-md gap-2 transition-colors ${
            activeTab === "hisab" ? "bg-gray-700" : "hover:bg-gray-700"
          }`}
        >
          <FaCalculator className="text-blue-400" />
          Hisab
        </button>

        <button
          onClick={() => setActiveTab("voucher")}
          className={`flex items-center px-3 py-2.5 rounded-md gap-2 transition-colors ${
            activeTab === "voucher" ? "bg-gray-700" : "hover:bg-gray-700"
          }`}
        >
          <FaInbox className="text-green-400" />
          Voucher Inbox
        </button>

        {/* Distributor-only features */}
        <RoleBasedComponent requiredRoles={['distributor', 'admin']}>
          <button
            onClick={() => setActiveTab("manage-users")}
            className={`flex items-center px-3 py-2.5 rounded-md gap-2 transition-colors ${
              activeTab === "manage-users" ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            <FaUsers className="text-blue-400" />
            Manage Users
          </button>

          <button
            onClick={() => setActiveTab("create-user")}
            className={`flex items-center px-3 py-2.5 rounded-md gap-2 transition-colors ${
              activeTab === "create-user" ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            <FaUserPlus className="text-green-400" />
            Create User
          </button>

          <button
            onClick={() => setActiveTab("edit-user")}
            className={`flex items-center px-3 py-2.5 rounded-md gap-2 transition-colors ${
              activeTab === "edit-user" ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            <FaUserEdit className="text-yellow-400" />
            Edit User
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center px-3 py-2.5 rounded-md gap-2 transition-colors ${
              activeTab === "reports" ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            <FaFileAlt className="text-violet-400" />
            Reports
          </button>
        </RoleBasedComponent>
      </nav>

      <button
        className="mt-auto flex items-center px-3 py-2.5 rounded-md hover:bg-gray-700 gap-2 transition-colors"
        onClick={() => handleLogout(navigate)}
      >
        <FaSignOutAlt className="text-red-400" />
        Logout
      </button>
    </div>

    {/* Main Content Area */}
    <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
      {activeTab === "book" && <Center />}
      {activeTab === "hisab" && <div className="p-6">Hisab content coming soon...</div>}  
      {activeTab === "voucher" && <div className="p-6">Voucher Inbox coming soon...</div>}  
      {activeTab === "manage-users" && <DistributerUsers onEditUser={(userId) => {
        console.log("Editing user with ID:", userId);
        setSelectedUserId(userId);
        setActiveTab("edit-user");
      }}/>}
      {activeTab === "create-user" && <DistributorCreateUser theme="dark" />}
      {activeTab === "edit-user" && <DistributorEditUser userId={selectedUserId} theme="dark" />}
      {activeTab === "reports" && <Reports />}
    </div>
  </div>
  );
};

export default Layout;


