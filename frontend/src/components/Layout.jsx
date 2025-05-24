import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from "axios";
// import jsPDF from "jspdf";
// import { useSelector, useDispatch } from "react-redux";
// import { showLoading, hideLoading } from '../redux/features/alertSlice';
// import { setUser } from '../redux/features/userSlice';
// imort the FaSignOutAlt
import { FaSignOutAlt } from 'react-icons/fa';
// import { setData } from '../redux/features/dataSlice';
import { toast } from "react-toastify";
import Center from './Center';
import Spinner from '../components/Spinner'
import "jspdf-autotable";
import {
 
  FaBook,
  FaCalculator,
  FaInbox,
  FaDice,

} from 'react-icons/fa';
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
    </div>
  </div>
  );
};

export default Layout;


