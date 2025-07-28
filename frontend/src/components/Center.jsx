import React from 'react'
import { useState, useEffect } from 'react';
import { data, useNavigate } from 'react-router-dom';
import axios from "axios";
import jsPDF from "jspdf";
import { useSelector, useDispatch } from "react-redux";
import { showLoading, hideLoading } from '../redux/features/alertSlice';
import { setUser } from '../redux/features/userSlice';
// imort the FaSignOutAlt
import { FaSignOutAlt } from 'react-icons/fa';
// import { setData } from '../redux/features/dataSlice';
import { toast } from "react-toastify";
import { useRef } from 'react';

import Spinner from './Spinner'
import "jspdf-autotable";
import {
  FaUser,
  FaClock,
  FaCalendarAlt,
  FaFileUpload,
  FaPrint,
  FaTrash,
  FaCheckSquare,
  FaBook,
  FaCalculator,
  FaInbox,
  FaDice,
  FaMagic,
  FaCity,
  FaEllipsisH, // 2digits
  FaBalanceScale,
  FaUserTie,
  FaRing,
  FaCog,
  FaCheckCircle,
  FaArrowUp,
  FaEye,
  FaStar, FaMoon,

} from 'react-icons/fa';

// Hooks to manage states of the variables
// State for ledger selection, date, and draw time
//const [user, setUser] = useState(null);
// using the redux slice reducer
const Center = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const userData = useSelector((state) => state.user);
  const token = userData?.token || localStorage.getItem("token");
  // console.log(token);

  const lastIdRef = useRef(0); // keeps track of last used ID
 const getNextId = () => {
  lastIdRef.current += 1;
  return lastIdRef.current;
};

  const [ledger, setLedger] = useState("LEDGER");
  const [drawTime, setDrawTime] = useState("11 AM");  // time slot
  const [drawDate, setDrawDate] = useState(new Date().toISOString().split('T')[0]); // date
  const [closingTime, setClosingTime] = useState("");
  const [closingTimeObj, setClosingTimeObj] = useState(null);
  const [formattedClosingTime, setFormattedClosingTime] = useState("");
  const [entries, setEntries] = useState([]);  // table entries
  const [no, setNo] = useState('');
  const [f, setF] = useState('');
  const [s, setS] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [file, setFile] = useState(null);
  const [winningNumbers, setWinningNumbers] = useState([
    { number: "2453", color: [255, 0, 0], type: "first" },    // Red (RGB)
    { number: "1157", color: [0, 0, 255], type: "second" },   // Blue (RGB)
    { number: "2560", color: [0, 0, 255], type: "second" },   // Blue (RGB)
    { number: "8149", color: [0, 0, 255], type: "second" },   // Blue (RGB)
    { number: "8440", color: [0, 0, 255], type: "second" }     // Blue (RGB)
    
  ]);

  // State for storing permutations
  const [permutations, setPermutations] = useState([]);  // we will set permutation in the table entreis

  useEffect(() => {   // this iuse in table 
    if (drawDate && drawTime) {
      getAndSetVoucherData();
      getWinningNumbers(drawDate, drawTime);  // Fetch winning numbers when date or time changes
    }
  }, [drawDate, drawTime]);

  // get the user data profile
  useEffect(() => {
    ; (
      async () => {

        try {
          const token = localStorage.getItem("token");
          // console.log(token);

          if (!token) {
            navigate("/login");

            return;
          }

          // Decode token to get user ID
          const decodedToken = JSON.parse(atob(token.split(".")[1]));
          const userId = decodedToken.id;
          // console.log(userId);

          const response = await axios.get(`/api/v1/users/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          dispatch(setUser(response.data));
          //setUser(response.data);
        } catch (error) {
          setError("Failed to load user data");
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    )();

  }, [dispatch, navigate]);


  const addEntry = async (customeEntries = null) => {
    // e?.preventDefault();

    const dataToAdd = customeEntries || entries;
    if (dataToAdd.length > 0) {
      try {


        const formattedData = dataToAdd.map(entry => ({
          uniqueId: entry.no,
          firstPrice: Number(entry.f),
          secondPrice: Number(entry.s)
        }));

        const response = await axios.post("/api/v1/data/add-data", {
          timeSlot: drawTime,
          data: formattedData,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // dispatch(hideLoading()); // Optional
        toast.success("record added successfully! ✅");  // we have to use toast message instead of this (TBT)
        // setEntries([]); // Clear after saving
        setNo("");

        await getAndSetVoucherData();    // Re-fetch data to update the UI

      } catch (error) {
        dispatch(hideLoading());
        console.error("Error adding entries:", error.response?.data?.error || error.message);
        toast.error(error.response?.data?.error || "Failed to add record ❌");
      }
    } else {
      toast.warning("No record to save! ⚠️");
    }
  };


  //  get the data from the backend on specific date and time slot

  const fetchVoucherData = async (selectedDate, selectedTimeSlot) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get("/api/v1/data/get-data", {
        params: {
          date: selectedDate,
          timeSlot: selectedTimeSlot,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("getDatabydate", response);


      return response.data.data;
    } catch (error) {
      toast.error((error.response?.data?.error));
      return [];
    }
  };

  const getWinningNumbers = async (date, time) => {

    try {
      const response = await axios.get("/api/v1/data/get-winning-numbers", {
        params: {
          date: date,
          timeSlot: time,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if(response.data || response.data.winningNumbers) {
        const formattedNumbers = response.data.winningNumbers.map(item => ({
          number: item.number,
          type: item.type,
          color: item.type === 'first' ? [255, 0, 0] : 
                item.type === 'second' ? [0, 0, 255] : 
                [128, 0, 128] // Purple for third
        }));
        setWinningNumbers(formattedNumbers);
        return formattedNumbers
      } else {
        setWinningNumbers([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching winning numbers:", error);
      // toast.error("Failed to fetch winning numbers");
      setWinningNumbers([]);
      return [];
    }
  };

  const getAndSetVoucherData = async () => {  // use in to fetch data base on time/date
    const fetchedData = await fetchVoucherData(drawDate, drawTime);

    if (Array.isArray(fetchedData) && fetchedData.length > 0) {
      const filteredRecords = fetchedData.filter((record) => {
        const recordDate = new Date(record.date).toISOString().split("T")[0];
        const selectedDateISO = new Date(drawDate).toISOString().split("T")[0];
        return (
          recordDate === selectedDateISO &&
          record.timeSlot === drawTime
        );
      });

      const combinedEntries = filteredRecords.flatMap((record) =>
        record.data.map((item, index) => ({
          parentId: record._id, // to keep track of the parent record
          objectId: item._id, // to keep track of the parent record
          serial: index + 1, // creates a unique-enough ID without needing global index
          no: item.uniqueId,
          f: item.firstPrice,
          s: item.secondPrice,
          selected: false,
        }))
      );

      setEntries(combinedEntries);
      console.log("combined entires", combinedEntries);  // jo bhi entries hongi wo yengi


    } else {
      setEntries([]);
    }
  };

  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.parentId]) {
      acc[entry.parentId] = [];
    }
    acc[entry.parentId].push(entry);
    return acc;
  }, {});

  // delete handler the record based on id 

  const handleDeleteRecord = async (parentId) => {

    console.log("Deleting record with ID:", parentId);
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`/api/v1/data/delete-data/${parentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Record deleted successfully');
      await fetchVoucherData(); // Re-fetch updated data
      await getAndSetVoucherData();

    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }

  };

  // // logout th user 
  // // utils/auth.js (or inside any component)

  // const handleLogout = (navigate) => {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("user"); // if you're storing user info
  //   // Optionally show a toast
  //   toast.success("Logged out successfully!");
  //   // Navigate to login
  //   navigate("/login");
  // };







  useEffect(() => {
    // Parse drawTime and calculate closing time (e.g., 10:51 AM for 11 AM draw)
    const [hour, period] = drawTime.split(" ");
    let closingHour = parseInt(hour, 10);
    let ampm = period;

    if (period === "PM" && closingHour !== 12) closingHour += 12;
    if (period === "AM" && closingHour === 12) closingHour = 0;

    const date = new Date();
    date.setHours(closingHour - 1, 51, 0); // 9 minutes before the draw hour
    setClosingTimeObj(date);
  }, [drawTime]);

  // Update the live formatted time every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (closingTimeObj) {
        setFormattedClosingTime(
          closingTimeObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [closingTimeObj]);

  if (loading) {  // this is loading that is running in seprately 
    return <p className="text-center text-lg"><Spinner /></p>;
  }

  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }



  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {

      setFile(event.target.files[0]);
    }
  };


  const handleUpload = () => {
    if (!file) {
      alert("Please select a file first.");  // toast use krna ha 
      return;
    }
    console.log("Uploading:", file.name);
    // Add your file upload logic here (e.g., send to a backend server)
  };

  // Function to generate permutations
  const getPermutations = (str) => {
    let results = [];
    if (str.length === 1) return [str];

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const remainingChars = str.slice(0, i) + str.slice(i + 1);
      const remainingPermutations = getPermutations(remainingChars);

      for (const perm of remainingPermutations) {
        results.push(char + perm);
      }
    }
    return results;
  };


  // Function to get combinations of a certain length (for 4 figures Ring 24)
  const getCombinations = (str, length) => {
    if (length === 1) return str.split("");
    if (length === str.length) return [str];

    let combinations = [];
    for (let i = 0; i < str.length; i++) {
      let remaining = str.slice(0, i) + str.slice(i + 1);
      let subCombinations = getCombinations(remaining, length - 1);
      subCombinations.forEach(sub => combinations.push(str[i] + sub));
    }
    return combinations;
  };

  // Function to get all permutations of a string
  const getPermutation = (str) => {
    if (str.length === 1) return [str];

    return str.split("").flatMap((char, i) =>
      getPermutation(str.slice(0, i) + str.slice(i + 1)).map(perm => char + perm)
    );
  };

     
  
  // Function to generate ordered 3-digit permutations (actual function to get permutation)
  const generateOrderedPermutations = (num, length = 3) => {
    let str = num.toString();
    if (str.length !== 4) {
      console.log("plz enter a 4 digit number");
      return [];
    }
    let combinations = getCombinations(str, length);
    let allPermutations = combinations.flatMap(getPermutation);

    return Array.from(new Set(allPermutations)).sort((a, b) => a[0].localeCompare(b[0]));
  };




  // genarte the 5 figure ring (60)
  const generate5DigitPermutations = (num, length = 3) => {
    let str = num.toString();
    if (str.length !== 5) {
      console.log("Please enter a 5-digit number.");
      return [];
    }

    let combinations = getCombinations(str, length);
    let allPermutations = combinations.flatMap(getPermutation);

    return Array.from(new Set(allPermutations)).sort((a, b) => a[0].localeCompare(b[0]));
  };

  // genarte the 5 digit ring (120)
  const generate6DigitPermutations = (num, length = 3) => {
    let str = num.toString();
    if (str.length !== 6) {
      console.log("Please enter a 6-digit number.");
      return [];
    }

    let combinations = getCombinations(str, length);
    let allPermutations = combinations.flatMap(getPermutation);

    return Array.from(new Set(allPermutations)).sort((a, b) => a[0].localeCompare(b[0]));
  };

  // 12 tandolla 

  const generate3FigureRingWithX = (str) => {
    if (str.length !== 3) {
      console.log("Input must be a 3-digit string");
      return [];
    }

    const result = [];

    // Step 1: Regular permutations of the 3-digit number
    const perms = Array.from(new Set(getPermutations(str))); // e.g., 001, 010, 100
    result.push(...perms);

    // Step 2: Insert 'x' at each position with padding
    for (let perm of perms) {
      result.push("+" + perm);                      // x001, x010, x100
      result.push(perm[0] + "+" + perm.slice(1));   // 0x01, 0x10, 1x00
      result.push(perm.slice(0, 2) + "+" + perm[2]); // 00x1, 01x0, 10x0
    }

    return Array.from(new Set(result)); // Remove any duplicates
  };  
  
     

  const generate4FigurePacket = (num) => {
    let str = num.toString();
    if (str.length !== 4) {
      console.log("Please enter exactly a 4-digit number.");
      return [];
    }
  
    const getPermutations = (str) => {
      if (str.length === 1) return [str];
  
      let results = [];
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const remaining = str.slice(0, i) + str.slice(i + 1);
        const permsOfRemaining = getPermutations(remaining);
        permsOfRemaining.forEach(perm => results.push(char + perm));
      }
      return results;
    };
  
    const allPermutations = getPermutations(str);
  
    // Remove duplicates and sort
    return Array.from(new Set(allPermutations)).sort();
  };
  

  const handleSingleEntrySubmit = () => {
  if (!no || !f || !s) {
    toast.warning("Please fill all fields.");
    return;
  }

  const entry = {
    id: entries.length+1, // or use getNextId() / uuid()
    no,
    f,
    s,
    selected: false,
  };

  addEntry([entry]);

  // Optional: clear fields
  setNo("");
  // setF("");
  // setS("");
};



  const handle4FigurePacket = () => {
    if (!no || no.length < 4 || !f || !s) {
      alert("Please enter at least a 4-digit number and F/S values.");
      return;
    }
  
    if (no.length !== 4) {
      alert("Please enter exactly a 4-digit number.");
      return;
    }
  
    const result = generate4FigurePacket(no);
    console.log(result); // Will show 24 permutations
  
    const updatedEntries = result.map((perm, index) => ({
      id: entries.length + index + 1,
      no: perm,
      f: f,
      s: s,
      selected: false,
    }));
  
    addEntry(updatedEntries);
  
    console.log(`✅ ${updatedEntries.length} entries added successfully!`);
  };
  
  



  

  const handlePaltiTandula = () => {
    if (!no || no.length < 4 || !f || !s) {
      alert("Please enter at least a 4-digit number and F/S values.");
      return;
    }
  
    let result = [];
  
    if (no.length === 4) {
      result = generateOrderedPermutations(no, 3); // 4-digit ring
    } else if (no.length === 5) {
      result = generate5DigitPermutations(no, 3); // 5-digit ring
    } else if (no.length >= 6) {
      result = generate6DigitPermutations(no, 3); // 6-digit ring
    }
  
    const updatedEntries = result.map((perm, index) => ({
      id: entries.length + index + 1,
      no: perm,
      f: f,
      s: s,
      selected: false,
    }));
  
    addEntry(updatedEntries); // Or setEntries(...), depending on your app state
  };
  


  // 12 tandulla ring  3 figure ring
  const handle3FigureRingWithX = () => {
    if (no && f && s) {
      // Generate permutations with 'x' substitutions
      const generatedRingPermutations = generate3FigureRingWithX(no);

      // Create new entry objects
      const updatedEntries = generatedRingPermutations.map((perm, index) => ({
        id: entries.length + index + 1,
        no: perm,
        f: f,
        s: s,
        selected: false
      }));

      console.log("3-Figure Ring Entries:", updatedEntries);

      // Add entries using your existing handler
      addEntry(updatedEntries);
    }
  };


  const handleChakriRing = () => {
    if (no && f && s) {
      const generatedPermutations = getPermutations(no);  // Generates multiple numbers

      // Create new entries for each permutation
      const updatedEntries = generatedPermutations.map((perm, index) => ({
        id: entries.length + index + 1, // Ensure unique IDs
        no: perm,
        f: f,
        s: s,
        selected: false
      }));
      console.log(updatedEntries);

      // setEntries((prevEntries) => [...prevEntries, ...updatedEntries]);  // ✅ Append instead of replacing
      // setTimeout (()=>{
      //   addEntry();
      // }, 0);
      //  addEntry(); // Call addEntry with the new entries
      addEntry(updatedEntries); // Pass the new entries to addEntry
    }
  };


  // Handle Chakri Back Ring button click
  const handleChakriRingBack = () => {
    if (no && f && s) {
      const generatedPermutations = getPermutations(no);
      const updatedEntriesback = generatedPermutations.map((perm, index) => ({
        id: entries.length + index + 1,
        no: `+${perm}`, // Ensure both are strings
        f: f,
        s: s,
        selected: false
      }));
      // setEntries((prevEntries) => [...prevEntries, ...updatedEntriesback]);  // ✅ Append instead of replacing
      //  setNo(''),
      //  setF(''),
      //  setS('')
      //  console.log(updatedEntriesback);
      // set the fields empty
      addEntry(updatedEntriesback); // Pass the new entries to addEntry
    }
  };

  // Handle Chakri Ring button click
  const handleChakriRingCross = () => {
    if (no && f && s) {
      const generatedPermutations = getPermutations(no);
      const updatedEntriescross = generatedPermutations.map((perm, index) => {
        const modifiedPerm = perm.slice(0, 1) + "+" + perm.slice(1); // Insert "x" at the second position

        return {
          id: entries.length + index + 1,
          no: modifiedPerm,  // 1x23
          f: f,
          s: s,
          selected: false
        };
      });


      addEntry(updatedEntriescross); // Pass the new entries to addEntry
    }
  };

  // Handle Chakri Ring with double cross button click
  const handleChakriRingDouble = () => {
    if (no && f && s) {
      const generatedPermutations = getPermutations(no);
      const updatedEntriesdouble = generatedPermutations.map((perm, index) => {
        const modifiedPerm = perm.slice(0, 2) + "+" + perm.slice(2); // Insert "x" at the second position

        return {
          id: entries.length + index + 1,
          no: modifiedPerm,  // 12x3
          f: f,
          s: s,
          selected: false
        };
      });


      addEntry(updatedEntriesdouble); // Pass the new entries to addEntry
    }
  };

  // function to AKR 2 figure 

  const handleAKR2Figure = () => {
    if (no.length !== 2 || !f || !s) {
      console.log("Please enter a 2-digit number and prices.");
      return;
    }

    const num = no.toString();
    const generatedPatterns = [
      num,       // "23"
      `+${num}+`,   // "+23+"
      `++${num}`, // "++23"
      `${num[0]}+${num[1]}`, // "2+3"
      `+${num[0]}+${num[1]}`, // "+2+3"
      `${num[0]}++${num[1]}`  // "2++3"
    ];

    const updatedEntries = generatedPatterns.map((pattern, index) => ({
      id: entries.length + index + 1,
      no: pattern,
      f: f,
      s: s,
      selected: false
    }));

    // setEntries((prevEntries) => [...prevEntries, ...updatedEntries]);  // Append new entries
    addEntry(updatedEntries)
  };


  

  const handlePaltiAKR = () => {
    if (!f || !s) {
      alert("Please enter valid F/S values.");
      return;
    }

    if (no.length >= 3 && no.length <= 6) {
      const combinations = getCombinations(no, 2); // Get all 2-digit combinations
      const pairs = combinations.flatMap(getPermutation); // Get ordered pairs
      const uniquePairs = [...new Set(pairs)]; // Remove duplicates

      const formatted = uniquePairs.map((pair, index) => ({
        id: entries.length + index + 1,
        no: pair,
        f: f,
        s: s,
        selected: false,
      }));

      addEntry(formatted);
    } else {
      alert("Please enter a valid 3, 4, 5, or 6-digit number.");
    }
  };



  const handleRingPlusAKR = () => {
    if (no.length === 3 && f && s) {
      const threeDigit = {
        id: entries.length + 1,
        no: no,
        f: f,
        s: s,
        selected: false,
      };

      const twoDigit = {
        id: entries.length + 2,
        no: no.slice(0, 2),
        f: f,
        s: s,
        selected: false,
      };

      setEntries(prev => [...prev, threeDigit, twoDigit]);
    } else {
      alert("Please enter exactly 3 digits and valid F/S values");
    }
  };

  const handlePacket    =  ()=>{
        // 
  }
   
    // 1. generate voucher pdf 
const generateVoucherPDF = async () =>{

       const fetchedEntries = await fetchVoucherData(drawDate, drawTime);
      if (fetchedEntries.length === 0) {
        toast.info("No Record found..");
        return;
      }
    
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
    
      const allVoucherRows = fetchedEntries
        .filter(entry => entry.timeSlot === drawTime)
        .flatMap(entry => entry.data.map(item => [
          item.uniqueId,
          item.firstPrice,
          item.secondPrice
        ]));
    
      const totalEntries = allVoucherRows.length;
      
      // ✅ Calculate totals
  const totals = allVoucherRows.reduce(
    (acc, row) => {
      acc.firstTotal += row[1];
      acc.secondTotal += row[2];
      return acc;
    },
    { firstTotal: 0, secondTotal: 0 }
  );
  const grandTotal = totals.firstTotal + totals.secondTotal;
    
    const addHeader = () => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Voucher Sheet", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Dealer Name: ${userData?.user.username}`, 14, 30);
  doc.text(`City: ${userData?.user.city}`, 14, 40);
  doc.text(`Draw Date: ${drawDate}`, 14, 50);
  doc.text(`Draw Time: ${drawTime}`, 14, 60);
  doc.text(`Total Entries: ${totalEntries}`, 14, 70);

 

  // ✅ Add Totals
  doc.text(`First Total: ${totals.firstTotal}`, 110, 50);
  doc.text(`Second Total: ${totals.secondTotal}`, 110, 60);
  doc.text(`Grand Total: ${grandTotal}`, 110, 70);
};
    
      addHeader();
    
      let startY = 80; // After the total entries line
      let rowHeight = 7; // Row height
      const colWidths = [20, 15, 15]; // Widths for Number, First, Second
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);
      const gapBetweenTables = 8; // Space between tables
      const xStart = 14;
    
      // Set manual 4 columns
      const xOffsets = [];
      for (let i = 0; i < 3; i++) {
        xOffsets.push(xStart + i * (tableWidth + gapBetweenTables));
      }
    
      let currentXIndex = 0;
      let currentY = startY;
    
      const printTableHeader = (x, y) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
    
        doc.rect(x, y, colWidths[0], rowHeight);
        doc.text("Number", x + 2, y + 5);
    
        doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
        doc.text("First", x + colWidths[0] + 2, y + 5);
    
        doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
        doc.text("Second", x + colWidths[0] + colWidths[1] + 2, y + 5);
    
        doc.setFont("helvetica", "normal");
      };
    
      // Print the first table header
      printTableHeader(xOffsets[currentXIndex], currentY);
      currentY += rowHeight;
    
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    
      allVoucherRows.forEach((row) => {
        const [number, first, second] = row;
        let x = xOffsets[currentXIndex];
    
        // Draw cells
        doc.rect(x, currentY, colWidths[0], rowHeight);
        doc.text(number.toString(), x + 2, currentY + 5);
    
        doc.rect(x + colWidths[0], currentY, colWidths[1], rowHeight);
        doc.text(first.toString(), x + colWidths[0] + 2, currentY + 5);
    
        doc.rect(x + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight);
        doc.text(second.toString(), x + colWidths[0] + colWidths[1] + 2, currentY + 5);
    
        currentY += rowHeight;
    
        if (currentY > pageHeight - 20) {
          // Reached bottom of page
          currentY = startY;
          currentXIndex++;
    
          if (currentXIndex >= xOffsets.length) {
            // All columns filled, create new page
            doc.addPage();
            currentXIndex = 0;
            currentY = startY;
          }
    
          // After new column or page, print new table header
          printTableHeader(xOffsets[currentXIndex], currentY);
          currentY += rowHeight;
        }
      });
    
      doc.save("Voucher_Sheet_RLC.pdf");
      toast.success("Voucher PDF downloaded successfully!");
       
}

const generateLedgerPDF = async () => {
   // console.log("Generating Ledger PDF...");
 
    // user's commison assigned by distributor admin
  // user's share assigned by distributor admin
  // these values come form user data profile 
  // then we can use directly here to calculate 

  const fetchedEntries = await fetchVoucherData(drawDate, drawTime);
  if (fetchedEntries.length === 0) {
    toast.info("No Record found..");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.width;

  const allVoucherRows = fetchedEntries
    .filter(entry => entry.timeSlot === drawTime)
    .flatMap(entry =>
      entry.data.map(item => ({
        number: item.uniqueId,
        first: item.firstPrice,
        second: item.secondPrice
      }))
    );

  const hinsa = [], akra = [], tandola = [], pangora = [];

  allVoucherRows.forEach(({ number, first, second }) => {
    // if (
    //   /^\d{2}$/.test(number) ||
    //   (number.includes('+') && number.length <= 4)
    // ) {
    //   akra.push([number, first, second]);
    // } else if (
    //   /^\d{3}$/.test(number) ||
    //   (number.length === 4 && number.includes('x'))
    // ) {
    //   tandola.push([number, first, second]);
    // } else if (/^\d{4}$/.test(number)) {
    //   pangora.push([number, first, second]);
    // }
    if (/^\d{1}$/.test(number)) {
      // Single digit numbers go to hinsa
      hinsa.push([number, first, second]);
    } else if (
      /^\d{2}$/.test(number) ||
      (number.includes('+') && number.length <= 3)
    ) {
      akra.push([number, first, second]);
    } else if (
      /^\d{3}$/.test(number) ||
      (number.length === 4 && number.includes('+'))
    ) {
      tandola.push([number, first, second]);
    } else if (/^\d{4}$/.test(number)) {
      pangora.push([number, first, second]);
    }
  });

  const addHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Ledger Sheet", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Dealer Name: ${userData?.user.username}`, 14, 30);
    doc.text(`City: ${userData?.user.city}`, 14, 40);
    doc.text(`Draw Date: ${drawDate}`, 14, 50);
    doc.text(`Draw Time: ${drawTime}`, 14, 60);
    doc.text(`Winning Numbers: `, 14, 70);
    // const winningNumbers = [
    //   { number: "F: 3456", color: [255, 0, 0] },    // Red (RGB)
    //   { number: "S: 6768", color: [0, 0, 255] },    // Blue (RGB)
    //   { number: "S: 7990", color: [0, 0, 255] }     // Blue (RGB)
    // ];
    
    let xPosition = 14 + doc.getTextWidth("Winning Numbers: "); // Start after the label
    
    winningNumbers.forEach((item, index) => {
      // Set the color for this number
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      
      // Add the number
      doc.text(item.number, xPosition, 70);
      
      // Move x position for next number
      xPosition += doc.getTextWidth(item.number);
      
      // Add comma and space (except for last number)
      if (index < winningNumbers.length - 1) {
        doc.setTextColor(0, 0, 0); // Black for space
        doc.text("    ", xPosition, 70);
        xPosition += doc.getTextWidth("    ");
      }
    });
    
    // Reset text color to black for subsequent text
    doc.setTextColor(0, 0, 0);
  };

  const calculateTotals = (rows) => {
    return rows.reduce(
      (acc, [, f, s]) => {
        acc.first += f;
        acc.second += s;
        return acc;
      },
      { first: 0, second: 0 }
    );
  };

  // const getEntryColor = (entryNumber) => {
  //   // Check for exact match first
  //   for (const winning of winningNumbers) {
  //     if (entryNumber === winning.number) {
  //       return winning.color;
  //     }
  //   }
  
  //   // Check for positional matches with + symbols
  //   for (const winning of winningNumbers) {
  //     if (checkPositionalMatch(entryNumber, winning.number)) {
  //       return winning.color;
  //     }
  //   }
  
  //   return [0, 0, 0]; // Default black color
  // };
  
  // const checkPositionalMatch = (entry, winningNumber) => {
  //   // Remove any spaces and ensure consistent format
  //   const cleanEntry = entry.toString().trim();
    
  //   // if (!cleanEntry.includes('+')) {
  //   //   // For plain numbers, only check if they are exact substrings of winning number
  //   //   // AND the entry has '+' patterns or is exactly the winning number
  //   //   return false;
  //   // }
  //   // Handle patterns like +4+6, +34+, etc.
  //   if (cleanEntry.includes('+')) {
  //     // For 2-digit patterns like +4+6
  //     if (cleanEntry.length === 4 && cleanEntry.match(/^\+\d\+\d$/)) {
  //       const digit1 = cleanEntry[1]; // 4
  //       const digit3 = cleanEntry[3]; // 6
        
  //       // Check if these digits match positions in winning number
  //       if (winningNumber[1] === digit1 && winningNumber[3] === digit3) {
  //         return true; // Matches positions 2 and 4 of 3456
  //       }
  //     }
      
  //     // For 3-digit patterns like +45+ (positions 2,3)
  //     if (cleanEntry.length === 4 && cleanEntry.match(/^\+\d\d\+$/)) {
  //       const digits = cleanEntry.slice(1, 3); // "45"
  //       if (winningNumber.slice(1, 3) === digits) {
  //         return true;
  //       }
  //     }
      
  //     // For patterns like 3+5+ (positions 1,3)
  //     if (cleanEntry.length === 4 && cleanEntry.match(/^\d\+\d\+$/)) {
  //       const digit1 = cleanEntry[0];
  //       const digit3 = cleanEntry[2];
  //       if (winningNumber[0] === digit1 && winningNumber[2] === digit3) {
  //         return true;
  //       }
  //     }
      
  //     // For patterns like ++56 (last two positions)
  //     if (cleanEntry.length === 4 && cleanEntry.match(/^\+\+\d\d$/)) {
  //       const digits = cleanEntry.slice(2); // "56"
  //       if (winningNumber.slice(2) === digits) {
  //         return true;
  //       }
  //     }
      
  //     // For patterns like +76+ (checking if 76 appears in positions 2,3 of winning number)
  //     if (cleanEntry.length === 4 && cleanEntry.match(/^\+\d\d\+$/)) {
  //       const digits = cleanEntry.slice(1, 3); // "76"
  //       if (winningNumber.slice(1, 3) === digits) {
  //         return true;
  //       }
  //     }

  //     // For patterns like 67+8 (checking consecutive positions)
  //     if (cleanEntry.length === 4 && cleanEntry.match(/^\d\d\+\d$/)) {
  //       const firstTwo = cleanEntry.slice(0, 2); // "67"
  //       const lastDigit = cleanEntry[3]; // "8"
  //       if (winningNumber.slice(0, 2) === firstTwo && winningNumber[3] === lastDigit) {
  //         return true;
  //       }
  //     }

  //     // For patterns like 6+68 (checking positions 1,3,4)
  //     if (cleanEntry.length === 4 && cleanEntry.match(/^\d\+\d\d$/)) {
  //       const firstDigit = cleanEntry[0]; // "6"
  //       const lastTwo = cleanEntry.slice(2); // "68"
  //       if (winningNumber[0] === firstDigit && winningNumber.slice(2) === lastTwo) {
  //         return true;
  //       }
  //     }

  //     // **NEW: For patterns like +990 (last 3 digits of 4-digit winning number)**
  //     if (cleanEntry.length === 4 && cleanEntry.match(/^\+\d\d\d$/)) {
  //       const lastThreeDigits = cleanEntry.slice(1); // "990"
  //       if (winningNumber.slice(1) === lastThreeDigits) { // Check if 7990 ends with 990
  //         return true;
  //       }
  //     }

  //     // **NEW: For patterns like +99 (last 2 digits)**
  //     if (cleanEntry.length === 3 && cleanEntry.match(/^\+\d\d$/)) {
  //       const lastTwoDigits = cleanEntry.slice(1); // "99"
  //       if (winningNumber.slice(-2) === lastTwoDigits) { // Check if 7990 ends with 99
  //         return true;
  //       }
  //     }

  //     // **NEW: For patterns like +9 (last digit)**
  //     if (cleanEntry.length === 2 && cleanEntry.match(/^\+\d$/)) {
  //       const lastDigit = cleanEntry.slice(1); // "9"
  //       if (winningNumber.slice(-1) === lastDigit) { // Check if 7990 ends with 9
  //         return true;
  //       }
  //     }

  //     // Pattern: +8 (matches if 8 appears in position 2,3, or 4 of winning number)
  //     if (cleanEntry.length === 2 && cleanEntry.match(/^\+\d$/)) {
  //       const digit = cleanEntry[1];
  //       // Check positions 2, 3, 4 (indices 1, 2, 3)
  //       for (let i = 1; i < winningNumber.length; i++) {
  //         if (winningNumber[i] === digit) {
  //           return true;
  //         }
  //       }
  //     }

  //     // Pattern: ++8 (matches if 8 appears in position 3 or 4 of winning number)
  //     if (cleanEntry.length === 3 && cleanEntry.match(/^\+\+\d$/)) {
  //       const digit = cleanEntry[2];
  //       // Check positions 3, 4 (indices 2, 3)
  //       for (let i = 2; i < winningNumber.length; i++) {
  //         if (winningNumber[i] === digit) {
  //           return true;
  //         }
  //       }
  //     }

  //     // Pattern: +++8 (matches if 8 appears in position 4 of winning number)
  //     if (cleanEntry.length === 4 && cleanEntry.match(/^\+\+\+\d$/)) {
  //       const digit = cleanEntry[3];
  //       // Check position 4 (index 3)
  //       if (winningNumber[3] === digit) {
  //         return true;
  //       }
  //     }
  //   }
    
    
  //   // Check for partial consecutive matches (like 45, 56, etc.)
  //   if (cleanEntry.length >= 2 && cleanEntry.length <= 3 && /^\d+$/.test(cleanEntry)) {
  //     // Only match if the entry starts from the beginning of the winning number
  //     if (winningNumber.startsWith(cleanEntry)) {
  //       return true;
  //     }
  //   }

  //   // **NEW: For single digit numbers without + symbols**
  //   // Pattern: 8 (matches if 8 appears in position 1 of winning number)
  //   if (cleanEntry.length === 1 && /^\d$/.test(cleanEntry)) {
  //     const digit = cleanEntry;
  //     // Check if digit matches first position of winning number
  //     if (winningNumber[0] === digit) {
  //       return true;
  //     }
  //   }
    
  //   return false;
  // };

  const updateWinningNumbers = (newWinningNumbers) => {
    setWinningNumbers(newWinningNumbers);
  };

  const grandTotals = {
    first: 0,
    second: 0,
    net: 0,
    // commission: 0,
    // payable: 0,
    winningAmount: 0,
    firstWinning: 0,
    secondWinning: 0,
  };

  // const renderSection = (title, rows, startY = 80) => {
  //   if (rows.length === 0) return startY;

  //   const rowHeight = 8;
  //   const colWidths = [50, 40, 40];
  //   let y = startY;

  //   const totals = calculateTotals(rows);
  //   const net = totals.first + totals.second;

  //   let commissionRate = 0;
  //   if (title === "AKRA") commissionRate = userData?.user.doubleFigure;
  //   else if (title === "TANDOLA") commissionRate = userData?.user.tripleFigure;
  //   else if (title === "PANGORA") commissionRate = userData?.user.fourFigure;

  //   const commissionAmount = net * commissionRate;
  //   const netPayable = net - commissionAmount;

  //   grandTotals.first += totals.first;
  //   grandTotals.second += totals.second;
  //   grandTotals.net += net;
  //   grandTotals.commission += commissionAmount;
  //   grandTotals.payable += netPayable;

  //   doc.setFont("helvetica", "bold");
  //   doc.setFontSize(14);
  //   doc.text(`${title} (${rows.length} entries)`, 14, y);
  //   y += 8;

  //   doc.setFontSize(10);
  //   doc.setFont("helvetica", "normal");
  //   doc.text(`First Total: ${totals.first}`, 14, y);
  //   doc.text(`Second Total: ${totals.second}`, 70, y);
  //   doc.text(`Net: ${net}`, 140, y);
  //   y += 5;
  //   doc.text(`Commission (${commissionRate * 100}%): -${commissionAmount.toFixed(2)}`, 14, y);
  //   doc.text(`Net Payable: ${netPayable.toFixed(2)}`, 140, y);
  //   y += 10;

  //   const x = 14;
  //   doc.setFont("helvetica", "bold");
  //   doc.rect(x, y, colWidths[0], rowHeight);
  //   doc.text("Number", x + 2, y + 6);
  //   doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
  //   doc.text("First", x + colWidths[0] + 2, y + 6);
  //   doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
  //   doc.text("Second", x + colWidths[0] + colWidths[1] + 2, y + 6);
  //   y += rowHeight;

  //   doc.setFont("helvetica", "normal");

  //   rows.forEach(([num, f, s]) => {
  //     if (y > 280) {
  //       doc.addPage();
  //       y = 20;
  //       doc.setFont("helvetica", "bold");
  //       doc.setFontSize(14);
  //       doc.text(title + " (cont...)", 14, y);
  //       y += 10;
  //       doc.setFontSize(10);
  //       doc.rect(x, y, colWidths[0], rowHeight);
  //       doc.text("Number", x + 2, y + 6);
  //       doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
  //       doc.text("First", x + colWidths[0] + 2, y + 6);
  //       doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
  //       doc.text("Second", x + colWidths[0] + colWidths[1] + 2, y + 6);
  //       y += rowHeight;
  //       doc.setFont("helvetica", "normal");
  //     }
  //     const entryColor = getEntryColor(num);
  //     doc.rect(x, y, colWidths[0], rowHeight);
  //     doc.setTextColor(entryColor[0], entryColor[1], entryColor[2]);

  //     doc.text(num.toString(), x + 2, y + 6);
  //     doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
  //     doc.text(f.toString(), x + colWidths[0] + 2, y + 6);
  //     doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
  //     doc.text(s.toString(), x + colWidths[0] + colWidths[1] + 2, y + 6);
  //     doc.setTextColor(0, 0, 0);
  //     y += rowHeight;
  //   });

  //   return y + 10;
  // };

  const renderSection = (title, rows, startY = 80) => {
    if (rows.length === 0) return startY;
  
    const rowHeight = 8;
    const colWidths = [20, 17, 17];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    let y = startY;
  
    const totals = calculateTotals(rows);
    const net = totals.first + totals.second;
  
    // let commissionRate = 0;
    // if (title === "AKRA") commissionRate = userData?.user.doubleFigure;
    // else if (title === "HINSA") commissionRate = userData?.user.singleFigure;
    // else if (title === "TANDOLA") commissionRate = userData?.user.tripleFigure;
    // else if (title === "PANGORA") commissionRate = userData?.user.fourFigure;
  
    // const commissionAmount = net * commissionRate;
    // const netPayable = net - commissionAmount;
  
    // grandTotals.first += totals.first;
    // grandTotals.second += totals.second;
    // grandTotals.net += net;
    // grandTotals.commission += commissionAmount;
    // grandTotals.payable += netPayable;
  
    // // Section title
    // doc.setFont("helvetica", "bold");
    // doc.setFontSize(14);
    // doc.text(`${title} (${rows.length} entries)`, 14, y);
    // y += 8;
  
    // // Summary information
    // doc.setFontSize(10);
    // doc.setFont("helvetica", "normal");
    // doc.text(`First Total: ${totals.first}`, 14, y);
    // doc.text(`Second Total: ${totals.second}`, 60, y);
    // doc.text(`Total : ${net}`, 106, y);
    // doc.text(`Commission (${commissionRate}%)`, 140, y);
    // y += 5;
    let commissionRate = 0;
    let multiplier = 0;
    
    if (title === "HINSA") {
      commissionRate = userData?.user.singleFigure;
      multiplier = 8;
    } else if (title === "AKRA") {
      commissionRate = userData?.user.doubleFigure;
      multiplier = 80;
    } else if (title === "TANDOLA") {
      commissionRate = userData?.user.tripleFigure;
      multiplier = 800;
    } else if (title === "PANGORA") {
      commissionRate = userData?.user.fourFigure;
      multiplier = 8000;
    }
  
    // const commissionAmount = net * commissionRate;
    // const netPayable = net - commissionAmount;
  
    // Calculate winning amounts for this section
    let firstWinningAmount = 0;
    let secondWinningAmount = 0;
  
    rows.forEach(([num, f, s]) => {
      const entryColor = getEntryColor(num);
      
      // Check if this entry is highlighted (has winning color)
      if (entryColor[0] !== 0 || entryColor[1] !== 0 || entryColor[2] !== 0) {
        // Find which winning number this matches
        for (const winning of winningNumbers) {
          if (num === winning.number || checkPositionalMatch(num, winning.number)) {
            if (winning.type === "first") {
              firstWinningAmount += f * multiplier;
              // secondWinningAmount += s * multiplier;
            } else if (winning.type === "second" || winning.type === "third") {
              // firstWinningAmount += (f * multiplier) / 3;
              secondWinningAmount += (s * multiplier) / 3;
            }
            break; // Exit loop once match is found
          }
        }
      }
    });
  
    const totalWinningAmount = firstWinningAmount + secondWinningAmount;
  
    grandTotals.first += totals.first;
    grandTotals.second += totals.second;
    grandTotals.net += net;
    // grandTotals.commission += commissionAmount;
    // grandTotals.payable += netPayable;
    grandTotals.winningAmount += totalWinningAmount;
    grandTotals.firstWinning += firstWinningAmount;
    grandTotals.secondWinning += secondWinningAmount;
  
    // Section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`${title} (${rows.length} entries)`, 14, y);
    y += 8;
  
    // Summary information with winning amount
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`First Total: ${totals.first}`, 14, y);
    doc.text(`Second Total: ${totals.second}`, 60, y);
    doc.text(`Total: ${net}`, 106, y);
    doc.text(`Commission (${commissionRate}%)`, 140, y);
    y += 5;
    doc.text(`Prize Amount: ${totalWinningAmount.toFixed(2)}`, 14, y);
    y += 5;
  
    // Split rows into three parts
    const thirdPoint = Math.ceil(rows.length / 3);
    const leftRows = rows.slice(0, thirdPoint);
    const middleRows = rows.slice(thirdPoint, thirdPoint * 2);
    const rightRows = rows.slice(thirdPoint * 2);
  
    // Table positions
    const leftX = 14;
    const middleX = leftX + tableWidth;
    const rightX = middleX + tableWidth;
  
    // Function to draw table header
    const drawTableHeader = (x, y) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      
      doc.rect(x, y, colWidths[0], rowHeight);
      doc.text("Number", x + 1, y + 5);
      
      doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
      doc.text("First", x + colWidths[0] + 1, y + 5);
      
      doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
      doc.text("Second", x + colWidths[0] + colWidths[1] + 1, y + 5);
      
      return y + rowHeight;
    };
  
    // Draw headers for all three tables
    let headerY = drawTableHeader(leftX, y);
    if (middleRows.length > 0) {
      drawTableHeader(middleX, y);
    }
    if (rightRows.length > 0) {
      drawTableHeader(rightX, y);
    }
  
    // Synchronized drawing of all three tables
    let currentY = headerY;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
  
    const maxRows = Math.max(leftRows.length, middleRows.length, rightRows.length);
  
    for (let i = 0; i < maxRows; i++) {
      // Check if we need a new page
      if (currentY > 280) {
        doc.addPage();
        
        // Add section header on new page
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(title + " (continued...)", 14, 20);
        
        // Reset Y position and redraw ALL table headers
        currentY = 35;
        
        // Draw headers for all three tables
        drawTableHeader(leftX, currentY);
        if (middleRows.length > 0) {
          drawTableHeader(middleX, currentY);
        }
        if (rightRows.length > 0) {
          drawTableHeader(rightX, currentY);
        }
        
        currentY += rowHeight;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
      }
  
      // Draw left table row
      if (i < leftRows.length) {
        const [num, f, s] = leftRows[i];
        const entryColor = getEntryColor(num);
        
        doc.rect(leftX, currentY, colWidths[0], rowHeight);
        doc.setTextColor(entryColor[0], entryColor[1], entryColor[2]);
        doc.text(num.toString(), leftX + 1, currentY + 5);

        doc.rect(leftX + colWidths[0], currentY, colWidths[1], rowHeight);
        doc.text(f.toString(), leftX + colWidths[0] + 1, currentY + 5);
        doc.rect(leftX + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight);
        doc.text(s.toString(), leftX + colWidths[0] + colWidths[1] + 1, currentY + 5);
        doc.setTextColor(0, 0, 0);
      }
  
      // Draw middle table row
      if (i < middleRows.length) {
        const [num, f, s] = middleRows[i];
        const entryColor = getEntryColor(num);
        
        doc.rect(middleX, currentY, colWidths[0], rowHeight);
        doc.setTextColor(entryColor[0], entryColor[1], entryColor[2]);
        doc.text(num.toString(), middleX + 1, currentY + 5);

        doc.rect(middleX + colWidths[0], currentY, colWidths[1], rowHeight);
        doc.text(f.toString(), middleX + colWidths[0] + 1, currentY + 5);
        doc.rect(middleX + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight);
        doc.text(s.toString(), middleX + colWidths[0] + colWidths[1] + 1, currentY + 5);
        doc.setTextColor(0, 0, 0);
      }
  
      // Draw right table row
      if (i < rightRows.length) {
        const [num, f, s] = rightRows[i];
        const entryColor = getEntryColor(num);
        
        doc.rect(rightX, currentY, colWidths[0], rowHeight);
        doc.setTextColor(entryColor[0], entryColor[1], entryColor[2]);
        doc.text(num.toString(), rightX + 1, currentY + 5);

        doc.rect(rightX + colWidths[0], currentY, colWidths[1], rowHeight);
        doc.text(f.toString(), rightX + colWidths[0] + 1, currentY + 5);
        doc.rect(rightX + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight);
        doc.text(s.toString(), rightX + colWidths[0] + colWidths[1] + 1, currentY + 5);
        doc.setTextColor(0, 0, 0);
      }
  
      currentY += rowHeight;
    }
  
    return currentY + 10;
  };

  const renderGrandTotals = (startY = 270) => {
    if (startY > 250) {
      doc.addPage();
      startY = 30;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Grand Totals Summary", 14, startY);
    startY += 8;

    const rowHeight = 8;
    const colWidths = [60, 30, 30, 40];
    const xStart = 14;

    const drawRow = (y, label, first, second, total) => {
      doc.setFont("helvetica", "normal");
      doc.rect(xStart, y, colWidths[0], rowHeight);
      doc.text(label, xStart + 2, y + 6);
      doc.rect(xStart + colWidths[0], y, colWidths[1], rowHeight);
      doc.text(first.toFixed(2), xStart + colWidths[0] + 2, y + 6);
      doc.rect(xStart + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
      doc.text(second.toFixed(2), xStart + colWidths[0] + colWidths[1] + 2, y + 6);
      doc.rect(xStart + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3], rowHeight);
      doc.text(total.toFixed(2), xStart + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 6);
    };

    const grandFirst = grandTotals.first;
    const grandSecond = grandTotals.second;
    const netTotal = grandFirst + grandSecond;

    // const commissionFirst = (grandFirst / netTotal) * grandTotals.commission;
    // const commissionSecond = (grandSecond / netTotal) * grandTotals.commission;

    // const netFirst = grandFirst - commissionFirst;
    // const netSecond = grandSecond - commissionSecond;

    let y = startY;

    doc.setFont("helvetica", "bold");
    doc.rect(xStart, y, colWidths[0], rowHeight);
    doc.text("Label", xStart + 2, y + 6);
    doc.rect(xStart + colWidths[0], y, colWidths[1], rowHeight);
    doc.text("First", xStart + colWidths[0] + 2, y + 6);
    doc.rect(xStart + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
    doc.text("Second", xStart + colWidths[0] + colWidths[1] + 2, y + 6);
    doc.rect(xStart + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3], rowHeight);
    doc.text("Total/Payable", xStart + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 6);

    y += rowHeight;
    drawRow(y, "Grand Total", grandFirst, grandSecond, netTotal);
    // y += rowHeight;
    // drawRow(y, "Commission", -commissionFirst, -commissionSecond, -grandTotals.commission);
    // y += rowHeight;
    // drawRow(y, "Net Payable", netFirst, netSecond, grandTotals.payable);
    y += rowHeight;
    drawRow(y, "Winning Amount", grandTotals.firstWinning, grandTotals.secondWinning, grandTotals.winningAmount);
  };

  addHeader();
  let nextY = 80;
  nextY = renderSection("HINSA", hinsa, nextY);
  nextY = renderSection("AKRA", akra, nextY);
  nextY = renderSection("TANDOLA", tandola, nextY);
  nextY = renderSection("PANGORA", pangora, nextY);
  renderGrandTotals(nextY);

  doc.save("Ledger_Sheet_RLC.pdf");
  toast.success("Ledger PDF downloaded successfully!");
};

  

const generateDailyBillPDF2 = async () => {
  console.log("Generating Daily Bill PDF...");

  const fetchedEntries = await fetchVoucherData(drawDate, drawTime);
  if (!Array.isArray(fetchedEntries) || fetchedEntries.length === 0) {
    toast.info("No record found for the selected date.");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Daily Bill", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Dealer: ${userData?.user.username}`, 14, 30);
  doc.text(`City: ${userData?.user.city}`, 14, 40);
  doc.text(`Date: ${drawDate}`, 14, 50);

  const groupedByTimeSlot = {};
  fetchedEntries.forEach(entry => {
    const slot = entry.timeSlot;
    if (!groupedByTimeSlot[slot]) {
      groupedByTimeSlot[slot] = [];
    }
    groupedByTimeSlot[slot].push(...entry.data);
  });

  let y = 70;
  const rowHeight = 10;
  const colWidths = [60, 60];
  const x = 14;

  // Table Header with box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.rect(x, y, colWidths[0], rowHeight);
  doc.text("Draw Time", x + 2, y + 7);
  doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
  doc.text("SALE", x + colWidths[0] + 2, y + 7);
  y += rowHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let dailyGrandTotal = 0;

  Object.entries(groupedByTimeSlot).forEach(([timeSlot, entries]) => {
    const grandTotal = entries.reduce((sum, item) => sum + item.firstPrice + item.secondPrice, 0);
    dailyGrandTotal += grandTotal;

    doc.rect(x, y, colWidths[0], rowHeight);
    doc.text(timeSlot, x + 2, y + 7);

    doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
    doc.text(grandTotal.toString(), x + colWidths[0] + 2, y + 7);

    y += rowHeight;

    if (y > 270) {
      doc.addPage();
      y = 30;
    }
  });

  // Final Grand Total in styled box
  // y += 10;
  // doc.setFont("helvetica", "bold");
  // doc.rect(x, y, colWidths[0], rowHeight);
  // doc.text("Daily Grand Total:", x + 2, y + 7);
  // doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
  // doc.text(dailyGrandTotal.toString(), x + colWidths[0] + 2, y + 7);

  doc.save("Daily_Bill_RLC.pdf");
  toast.success("Daily Bill PDF downloaded successfully!");
};


const getEntryColor = (entryNumber) => {
  // Check for exact match first
  for (const winning of winningNumbers) {
    if (entryNumber === winning.number) {
      return winning.color;
    }
  }

  // Check for positional matches with + symbols
  for (const winning of winningNumbers) {
    if (checkPositionalMatch(entryNumber, winning.number)) {
      return winning.color;
    }
  }

  return [0, 0, 0]; // Default black color
};

const checkPositionalMatch = (entry, winningNumber) => {
  // Remove any spaces and ensure consistent format
  const cleanEntry = entry.toString().trim();
  
  // if (!cleanEntry.includes('+')) {
  //   // For plain numbers, only check if they are exact substrings of winning number
  //   // AND the entry has '+' patterns or is exactly the winning number
  //   return false;
  // }
  // Handle patterns like +4+6, +34+, etc.
  if (cleanEntry.includes('+')) {
    // For 2-digit patterns like +4+6
    if (cleanEntry.length === 4 && cleanEntry.match(/^\+\d\+\d$/)) {
      const digit1 = cleanEntry[1]; // 4
      const digit3 = cleanEntry[3]; // 6
      
      // Check if these digits match positions in winning number
      if (winningNumber[1] === digit1 && winningNumber[3] === digit3) {
        return true; // Matches positions 2 and 4 of 3456
      }
    }
    
    // For 3-digit patterns like +45+ (positions 2,3)
    if (cleanEntry.length === 4 && cleanEntry.match(/^\+\d\d\+$/)) {
      const digits = cleanEntry.slice(1, 3); // "45"
      if (winningNumber.slice(1, 3) === digits) {
        return true;
      }
    }
    
    // For patterns like 3+5+ (positions 1,3)
    if (cleanEntry.length === 4 && cleanEntry.match(/^\d\+\d\+$/)) {
      const digit1 = cleanEntry[0];
      const digit3 = cleanEntry[2];
      if (winningNumber[0] === digit1 && winningNumber[2] === digit3) {
        return true;
      }
    }
    
    // For patterns like ++56 (last two positions)
    if (cleanEntry.length === 4 && cleanEntry.match(/^\+\+\d\d$/)) {
      const digits = cleanEntry.slice(2); // "56"
      if (winningNumber.slice(2) === digits) {
        return true;
      }
    }
    
    // For patterns like +76+ (checking if 76 appears in positions 2,3 of winning number)
    if (cleanEntry.length === 4 && cleanEntry.match(/^\+\d\d\+$/)) {
      const digits = cleanEntry.slice(1, 3); // "76"
      if (winningNumber.slice(1, 3) === digits) {
        return true;
      }
    }

    // For patterns like 67+8 (checking consecutive positions)
    if (cleanEntry.length === 4 && cleanEntry.match(/^\d\d\+\d$/)) {
      const firstTwo = cleanEntry.slice(0, 2); // "67"
      const lastDigit = cleanEntry[3]; // "8"
      if (winningNumber.slice(0, 2) === firstTwo && winningNumber[3] === lastDigit) {
        return true;
      }
    }

    // For patterns like 6+68 (checking positions 1,3,4)
    if (cleanEntry.length === 4 && cleanEntry.match(/^\d\+\d\d$/)) {
      const firstDigit = cleanEntry[0]; // "6"
      const lastTwo = cleanEntry.slice(2); // "68"
      if (winningNumber[0] === firstDigit && winningNumber.slice(2) === lastTwo) {
        return true;
      }
    }

    // **NEW: For patterns like +990 (last 3 digits of 4-digit winning number)**
    if (cleanEntry.length === 4 && cleanEntry.match(/^\+\d\d\d$/)) {
      const lastThreeDigits = cleanEntry.slice(1); // "990"
      if (winningNumber.slice(1) === lastThreeDigits) { // Check if 7990 ends with 990
        return true;
      }
    }

    // **NEW: For patterns like +99 (last 2 digits)**
    if (cleanEntry.length === 3 && cleanEntry.match(/^\+\d\d$/)) {
      const lastTwoDigits = cleanEntry.slice(1); // "99"
      if (winningNumber.slice(-2) === lastTwoDigits) { // Check if 7990 ends with 99
        return true;
      }
    }

    // **NEW: For patterns like +9 (last digit)**
    if (cleanEntry.length === 2 && cleanEntry.match(/^\+\d$/)) {
      const lastDigit = cleanEntry.slice(1); // "9"
      if (winningNumber.slice(-1) === lastDigit) { // Check if 7990 ends with 9
        return true;
      }
    }

    // Pattern: +8 (matches if 8 appears in position 2,3, or 4 of winning number)
    if (cleanEntry.length === 2 && cleanEntry.match(/^\+\d$/)) {
      const digit = cleanEntry[1];
      // Check positions 2, 3, 4 (indices 1, 2, 3)
      for (let i = 1; i < winningNumber.length; i++) {
        if (winningNumber[i] === digit) {
          return true;
        }
      }
    }

    // Pattern: ++8 (matches if 8 appears in position 3 or 4 of winning number)
    if (cleanEntry.length === 3 && cleanEntry.match(/^\+\+\d$/)) {
      const digit = cleanEntry[2];
      // Check positions 3, 4 (indices 2, 3)
      for (let i = 2; i < winningNumber.length; i++) {
        if (winningNumber[i] === digit) {
          return true;
        }
      }
    }

    // Pattern: +++8 (matches if 8 appears in position 4 of winning number)
    if (cleanEntry.length === 4 && cleanEntry.match(/^\+\+\+\d$/)) {
      const digit = cleanEntry[3];
      // Check position 4 (index 3)
      if (winningNumber[3] === digit) {
        return true;
      }
    }
  }
  
  
  // Check for partial consecutive matches (like 45, 56, etc.)
  if (cleanEntry.length >= 2 && cleanEntry.length <= 3 && /^\d+$/.test(cleanEntry)) {
    // Only match if the entry starts from the beginning of the winning number
    if (winningNumber.startsWith(cleanEntry)) {
      return true;
    }
  }

  // **NEW: For single digit numbers without + symbols**
  // Pattern: 8 (matches if 8 appears in position 1 of winning number)
  if (cleanEntry.length === 1 && /^\d$/.test(cleanEntry)) {
    const digit = cleanEntry;
    // Check if digit matches first position of winning number
    if (winningNumber[0] === digit) {
      return true;
    }
  }
  
  return false;
};  



const handleDownloadPDF = async () => {
      if (ledger === "VOUCHER") {
        await generateVoucherPDF();
      }
      else if (ledger === "LEDGER") {
        
        await generateLedgerPDF();
        
      }
      else if (ledger === "DAILY BILL") {
        await generateDailyBillPDF();
      }
      else {
        toast.error("Please select a valid ledger type.");
        
      }
    
     
};

const generateDailyBillPDF = async () => {
      console.log("Generating Daily Bill PDF...");
    
      const fetchedEntries = await fetchVoucherData(drawDate, drawTime);
      if (!Array.isArray(fetchedEntries) || fetchedEntries.length === 0) {
        toast.info("No record found for the selected date.");
        return;
      }
    
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;
    
      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Daily Bill", pageWidth / 2, 15, { align: "center" });
    
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Dealer: ${userData?.user.username}`, 14, 30);
      doc.text(`City: ${userData?.user.city}`, 14, 40);
      doc.text(`Date: ${drawDate}`, 14, 50);
    
      // Initialize grand totals for the day
      const dayGrandTotals = {
        first: 0,
        second: 0,
        net: 0,
        winningAmount: 0,
        firstWinning: 0,
        secondWinning: 0,
      };
    
      // Group by time slot
      const groupedByTimeSlot = {};
      fetchedEntries.forEach(entry => {
        const slot = entry.timeSlot;
        if (!groupedByTimeSlot[slot]) {
          groupedByTimeSlot[slot] = [];
        }
        groupedByTimeSlot[slot].push(...entry.data);
      });
    
      let y = 70;
      const rowHeight = 10;
      const colWidths = [40, 30, 30, 30, 30, 30];
      const x = 14;
    
      // Enhanced Table Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      
      // Draw header boxes
      doc.rect(x, y, colWidths[0], rowHeight);
      doc.text("Draw Time", x + 2, y + 7);
      
      doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
      doc.text("SALE", x + colWidths[0] + 2, y + 7);
      
      doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
      doc.text("PRIZE", x + colWidths[0] + colWidths[1] + 2, y + 7);
      
      doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3], rowHeight);
      doc.text("SUB TOTAL", x + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 7);
      
      doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, colWidths[4], rowHeight);
      doc.text("Share (45%)", x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y + 7);

      doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y, colWidths[5], rowHeight);
      doc.text("Bill", x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 2, y + 7);
      
      y += rowHeight;
    
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    
      // Calculate winning amounts helper function
      const calculateWinningForTimeSlot = (entries) => {
        const allVoucherRows = entries.map(item => ({
          number: item.uniqueId,
          first: item.firstPrice,
          second: item.secondPrice
        }));
    
        const hinsa = [], akra = [], tandola = [], pangora = [];
    
        // Categorize entries
        allVoucherRows.forEach(({ number, first, second }) => {
          if (/^\d{1}$/.test(number)) {
            hinsa.push([number, first, second]);
          } else if (
            /^\d{2}$/.test(number) ||
            /^\+\d$/.test(number) ||
            /^\+\+\d$/.test(number) ||
            /^\+\+\+\d$/.test(number) ||
            (number.includes('+') && number.length <= 4)
          ) {
            akra.push([number, first, second]);
          } else if (
            /^\d{3}$/.test(number) ||
            (number.length === 4 && number.includes('x'))
          ) {
            tandola.push([number, first, second]);
          } else if (/^\d{4}$/.test(number)) {
            pangora.push([number, first, second]);
          }
        });
    
        // Calculate winning amounts for each category
        const calculateSectionWinning = (rows, multiplier) => {
          let firstWinningAmount = 0;
          let secondWinningAmount = 0;
    
          rows.forEach(([num, f, s]) => {
            const entryColor = getEntryColor(num);
            
            if (entryColor[0] !== 0 || entryColor[1] !== 0 || entryColor[2] !== 0) {
              for (const winning of winningNumbers) {
                if (num === winning.number || checkPositionalMatch(num, winning.number)) {
                  if (winning.type === "first") {
                    firstWinningAmount += f * multiplier;
                  } else if (winning.type === "second" || winning.type === "third") {
                    secondWinningAmount += (s * multiplier) / 3;
                  }
                  break;
                }
              }
            }
          });
    
          return firstWinningAmount + secondWinningAmount;
        };
    
        const hinsaWinning = calculateSectionWinning(hinsa, 8);
        const akraWinning = calculateSectionWinning(akra, 80);
        const tandolaWinning = calculateSectionWinning(tandola, 800);
        const pangoraWinning = calculateSectionWinning(pangora, 8000);
    
        return hinsaWinning + akraWinning + tandolaWinning + pangoraWinning;
      };
    
      // Process each time slot
      Object.entries(groupedByTimeSlot).forEach(([timeSlot, entries]) => {
        const firstTotal = entries.reduce((sum, item) => sum + item.firstPrice, 0);
        const secondTotal = entries.reduce((sum, item) => sum + item.secondPrice, 0);
        const totalSale = firstTotal + secondTotal;
        const winningAmount = calculateWinningForTimeSlot(entries);
        const subtotal = totalSale - winningAmount;
        const shareAmount = subtotal * 0.45; // 45% share amount
        const billAmount = subtotal - shareAmount; // Bill amount after share deduction
        // Add to day totals
        dayGrandTotals.first += firstTotal;
        dayGrandTotals.second += secondTotal;
        dayGrandTotals.net += totalSale;
        dayGrandTotals.winningAmount += winningAmount;
    
        // Draw row
        doc.rect(x, y, colWidths[0], rowHeight);
        doc.text(timeSlot, x + 2, y + 7);
    
        doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
        doc.text(totalSale.toString(), x + colWidths[0] + 2, y + 7);
    
        doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
        doc.text(winningAmount.toFixed(2), x + colWidths[0] + colWidths[1] + 2, y + 7);
    
        doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3], rowHeight);
        doc.text(subtotal.toString(), x + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 7);
    
        doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, colWidths[4], rowHeight);
        doc.text(shareAmount.toString(), x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y + 7);

        doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y, colWidths[5], rowHeight);
        doc.text(billAmount.toFixed(2), x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 2, y + 7);
    
        y += rowHeight;
    
        // if (y > 270) {
        //   doc.addPage();
        //   y = 30;
          
        //   // Redraw header on new page
        //   doc.setFont("helvetica", "bold");
        //   doc.setFontSize(10);
          
        //   doc.rect(x, y, colWidths[0], rowHeight);
        //   doc.text("Draw Time", x + 2, y + 7);
          
        //   doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
        //   doc.text("First", x + colWidths[0] + 2, y + 7);
          
        //   doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
        //   doc.text("Second", x + colWidths[0] + colWidths[1] + 2, y + 7);
          
        //   doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3], rowHeight);
        //   doc.text("Total Sale", x + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 7);
          
        //   doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, colWidths[4], rowHeight);
        //   doc.text("Winning Amt", x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y + 7);
          
        //   y += rowHeight;
        //   doc.setFont("helvetica", "normal");
        //   doc.setFontSize(9);
        // }
      });
    
      // Add Grand Totals Section
      // y += 10;
      
      // if (y > 250) {
      //   doc.addPage();
      //   y = 30;
      // }
    
      // doc.setFont("helvetica", "bold");
      // doc.setFontSize(12);
      // doc.text("Daily Grand Totals", 14, y);
      // y += 10;
    
      // // Grand totals table
      // const grandTotalRowHeight = 12;
      
      // // Header
      // doc.setFont("helvetica", "bold");
      // doc.setFontSize(10);
      
      // doc.rect(x, y, colWidths[0], grandTotalRowHeight);
      // doc.text("Category", x + 2, y + 8);
      
      // doc.rect(x + colWidths[0], y, colWidths[1], grandTotalRowHeight);
      // doc.text("First", x + colWidths[0] + 2, y + 8);
      
      // doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], grandTotalRowHeight);
      // doc.text("Second", x + colWidths[0] + colWidths[1] + 2, y + 8);
      
      // doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3], grandTotalRowHeight);
      // doc.text("Total Sale", x + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 8);
      
      // doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, colWidths[4], grandTotalRowHeight);
      // doc.text("Winning", x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y + 8);
      
      // y += grandTotalRowHeight;
    
      // // Data rows
      // doc.setFont("helvetica", "normal");
      
      // // Daily Totals
      // doc.rect(x, y, colWidths[0], grandTotalRowHeight);
      // doc.text("Daily Total", x + 2, y + 8);
      
      // doc.rect(x + colWidths[0], y, colWidths[1], grandTotalRowHeight);
      // doc.text(dayGrandTotals.first.toString(), x + colWidths[0] + 2, y + 8);
      
      // doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], grandTotalRowHeight);
      // doc.text(dayGrandTotals.second.toString(), x + colWidths[0] + colWidths[1] + 2, y + 8);
      
      // doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3], grandTotalRowHeight);
      // doc.text(dayGrandTotals.net.toString(), x + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 8);
      
      // doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, colWidths[4], grandTotalRowHeight);
      // doc.text(dayGrandTotals.winningAmount.toFixed(2), x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y + 8);
      
      // y += grandTotalRowHeight;
    
      // // Net Result (Sale - Winning)
      // const netResult = dayGrandTotals.net - dayGrandTotals.winningAmount;
      
      // doc.setFont("helvetica", "bold");
      // doc.rect(x, y, colWidths[0] + colWidths[1] + colWidths[2], grandTotalRowHeight);
      // doc.text("Net Result (Sale - Winning):", x + 2, y + 8);
      
      // doc.rect(x + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3] + colWidths[4], grandTotalRowHeight);
      // doc.setTextColor(netResult >= 0 ? 0 : 255, netResult >= 0 ? 128 : 0, 0); // Green if positive, red if negative
      // doc.text(netResult.toFixed(2), x + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 8);
      // doc.setTextColor(0, 0, 0); // Reset to black
    
      doc.save("Daily_Bill_RLC.pdf");
      toast.success("Daily Bill PDF downloaded successfully!");
};
    





  




  const isPastClosingTime = (time) => {
    const [hour, period] = time.split(" ");
    let drawHour = parseInt(hour, 10);
    if (period === "PM" && drawHour !== 12) drawHour += 12;
    if (period === "AM" && drawHour === 12) drawHour = 0;

    let closingHour = drawHour - 1;
    if (closingHour === -1) closingHour = 23;

    const closingTimeObj = new Date();
    closingTimeObj.setHours(closingHour, 51, 0);

    return currentTime >= closingTimeObj;
  };

  {/* Main Content */ }




  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto ">
      {/* Header */}
      <header className="bg-gray-800 p-4 rounded-xl grid grid-cols-1 lg:grid-cols-2 gap-3 items-start mb-6 border border-gray-700">
        <div className="flex flex-col space-y-4 p-4">

          <div className="flex items-center gap-2 text-lg">
            <FaUserTie className="text-blue-400" />
            <span className="font-semibold">Name:</span>

            <input
              type="text"
              value={userData?.user.username}
              className="bg-gray-700 text-gray-100 px-3 py-1.5 rounded-lg border border-gray-600 flex-1"
              readOnly
            />
          </div>

          <div className="flex items-center gap-2 text-lg">
            <FaUserTie className="text-blue-400" />
            <span className="font-semibold">ID:</span>
            <input
              type="text"
              value={userData?.user.dealerId}
              className="bg-gray-700 text-gray-100 px-3 py-1.5 rounded-lg border border-gray-600 flex-1"
              readOnly
            />

          </div>

          <div className="flex items-center gap-2 text-lg">
            <FaCity className="text-blue-400" />
            <span className="font-semibold">CITY:</span>
            <input
              type="text"
              value={userData?.user?.city}
              className="bg-gray-700 text-gray-100 px-3 py-1.5 rounded-lg border border-gray-600 flex-1"
              readOnly
            />

          </div>


          <div className="flex items-center gap-2 text-lg">
            <FaBalanceScale className="text-blue-400" />
            <span className="font-semibold">BALANCE:</span>
            <input
              type="text"
              value={userData?.user?.balance}
              className="bg-gray-700 text-gray-100 px-3 py-1.5 rounded-lg border border-gray-600 flex-1"
              readOnly
            />

          </div>
        </div>
        {/* user info done here */}

        <div className="flex flex-col space-y-2">
          {/* Ledger dropdown */}
          <div className="text-lg font-semibold flex items-center space-x-2">
            <span>Ledger:</span>
            <select
              className="bg-gray-700 text-gray-100 px-3 py-2 rounded-lg border border-gray-600 flex-1"
              value={ledger}
              onChange={(e) => setLedger(e.target.value)}
            >
              <option>LEDGER</option>
              <option>DAILY BILL</option>
              <option>VOUCHER</option>
            </select>
          </div>

          {/* Draw Name Dropdown */}
          <div className="text-lg font-semibold flex items-center space-x-2">
            <FaClock className="text-purple-400" />
            <span>Draw Name:</span>
            <select
              className="bg-gray-700 text-white px-2 py-1 rounded"
              value={drawTime}
              onChange={(e) => setDrawTime(e.target.value)}
            >
              {[...Array(13)].map((_, i) => {
                const hour = 11 + i;
                const period = hour >= 12 ? "PM" : "AM";
                const formattedHour = hour > 12 ? hour - 12 : hour;
                const time = `${formattedHour === 0 ? 12 : formattedHour} ${period}`;
                return (
                  <option key={time} value={time}>
                    {time}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Draw Date Input */}
          <div className="text-lg font-semibold flex items-center space-x-2">
            <FaCalendarAlt className="text-purple-400" />
            <span>Draw Date:</span>
            <input
              type="date"
              className="bg-gray-400 text-white px-2 py-1 rounded"
              value={drawDate}
              onChange={(e) => setDrawDate(e.target.value)}
            />
          </div>

          {/* Print Button */}
          <button
            className="flex items-center  space-x-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-500 transition"
            onClick={handleDownloadPDF}
          >
            <FaPrint />
            <span >Print</span>
          </button>
        </div>
        {/* ledger voucher bill print end here */}

        {/* Draw Time Section */}
        <div className=" p-4 bg-gray-800 rounded-lg  border border-gray-900 text-white">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <FaClock className="text-purple-400" />
            <span>Draw Time Selection</span>
          </h2>

          {/* Time Dropdown */}
          <div className="mb-4">
            <label className="flex text-lg font-semibold mb-2 flex items-center space-x-2">
              <FaClock className="text-purple-400" />
              <span>Select Draw Time:</span>
            </label>
            <select
              className="bg-gray-700 text-white px-3 py-2 rounded w-full border border-gray-600"
              value={drawTime}
              onChange={(e) => setDrawTime(e.target.value)}
            >
              {[...Array(13)].map((_, i) => {
                const hour = 11 + i;
                const period = hour >= 12 ? "PM" : "AM";
                const formattedHour = hour > 12 ? hour - 12 : hour;
                const time = `${formattedHour === 0 ? 12 : formattedHour} ${period}`;
                return (
                  <option
                    key={time}
                    value={time}
                    disabled={isPastClosingTime(time)}
                    className={`${isPastClosingTime(time) ? "bg-red-500 text-white" : "bg-gray-700 text-white"
                      }`}
                  >
                    {time} {isPastClosingTime(time) ? "(Closed)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Today Date */}
          <p className="text-white flex items-center space-x-2">
            <FaCalendarAlt className="text-purple-400" />
            <span>
              <strong>Today Date:</strong> {new Date().toLocaleDateString()} (
              {new Date().toLocaleString("en-us", { weekday: "long" })})
            </span>
          </p>

          {/* Closing Time Calculation */}
          <p className="text-white flex items-center space-x-2 mt-2">
            <FaClock className="text-purple-400" />
            <span>
              <strong>Closing Time:</strong> {formattedClosingTime || "Loading..."}
            </span>
          </p>
        </div>

        <div className='bg-gray-800 rounded-xl p-4 border border-gray-900' >
          <h1 className='text-2xl  text-center'>NOTIFATION</h1>
          Winning numbers
          {winningNumbers.map((item, index) => (
            <div key={index} className='flex justify-between items-center text-lg font-semibold text-white mb-2'>
              <span className='text-green-400'>{item.type.toUpperCase()}:</span>
              <span className='text-yellow-400'>{item.number}</span>
            </div>
          ))}
          {/* <h3>F:9876</h3>
          <h3>S:2362, 7612, 8722,</h3> */}
        </div>

      </header>
      {/* // header end */}


      {/* Body Content */}
      <div className="grid grid-cols-2 gap-6 mt-6 ">

        {/* Table Content */}
        <div className='bg-gray-800 border border-gray-700 min-h-[500px] p-6 rounded-lg shadow-md flex flex-col'>

          {        /* Table Header */}
          <div className='flex justify-center my-2'>
            <span className='text-2xl'>{`(${entries.length})`}</span>
          </div>

          {entries.length === 0 && (
            <div className='text-center text-white-500'>No record found</div>
          )}

          <div className='max-h-80 border rounded-md overflow-y-auto'>
            {Object.entries(groupedEntries).map(([parentId, group]) => (
              <div key={parentId} className="mb-4 border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  {/* <h2 className="font-semibold text-lg">Document ID: {parentId}</h2> */}
                  <button
                    onClick={() => handleDeleteRecord(parentId)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 "
                  >
                    Delete
                  </button>
                </div>

                <table className="w-full border-collapse border border-gray-900 text-sm">
                  <thead>
                    <tr className="bg-gray-400">
                      <th className="border px-3 py-2">#</th>
                      <th className="border px-3 py-2">NO</th>
                      <th className="border px-3 py-2">First Price</th>
                      <th className="border px-3 py-2">Second Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((entry, index) => (
                      <tr key={index} className="text-center">
                        <td className="border px-3 py-2">{index + 1}</td>
                        <td className="border px-3 py-2">{entry.no}</td>
                        <td className="border px-3 py-2">{entry.f}</td>
                        <td className="border px-3 py-2">{entry.s}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          </div>

          {/* Input Fields - Fixed at the Bottom */}
          <div className='mt-auto flex space-x-2 pt-4'>
            <input
              type='text'
              value={no}
              onChange={(e) => setNo(e.target.value)}
              placeholder='NO'
              className='border p-2 rounded w-1/3'
              // disabled={isPastClosingTime(drawTime)}
            />
            <input
              type='text' 
              value={f}
              onChange={(e) => setF(e.target.value)}
              placeholder='F'
              className='border p-2 rounded w-1/3'
              // disabled={isPastClosingTime(drawTime)}
            />  
            <input
              type='text'
              value={s}
              onChange={(e) => setS(e.target.value)}
              placeholder='S'
              className='border p-2 rounded w-1/3'
              // disabled={isPastClosingTime(drawTimene)}
            />
            <button
              onClick={handleSingleEntrySubmit}
              className={`px-4 py-2 rounded text-white ${isPastClosingTime(drawTime) ? "bg-gray-600 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"}`}
              // disabled={isPastClosingTime(drawTime)}
            >
              Save
            </button>
          </div>
        </div>




        {/* Printable Voucher */}




        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md text-white">
          <div className="flex space-x-4 mb-4">
            <div>
              {/* Hidden file input */}
              <input type="file" className="hidden" id="fileInput" onChange={handleFileChange} />

              {/* Upload Button */}
              <label htmlFor="fileInput" className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-400 cursor-pointer">
                <FaFileUpload />
                <span>Choose File</span>
              </label>

              <button onClick={handleUpload} className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-400 mt-2">
                <FaArrowUp />
                <span>Upload Sheet</span>
              </button>
            </div>
            <button className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-400">
              <FaEye />
              <span>View Sheet</span>
            </button>
          </div>
          {/* Buttons Section */}
          <div className="flex gap-4 pt-4">
            {/* Left Column */}
            <div className="w-1/2">
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handleChakriRing}>
                <FaStar /> <FaStar /> <FaStar /> <span>Chakri Ring</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handleChakriRingBack}>
                <FaStar /> <FaStar /> <FaStar /> <span>Back Ring</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handleChakriRingCross}>
                <FaStar /> <FaStar /> <FaStar /> <span>Cross Ring</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handleChakriRingDouble}>
              <FaStar /> <FaStar /> <FaStar /> <span>Double Cross</span>
              </button>
              {/* <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handle5FiguresRing}>
                <FaStar /> <span>5 Figure Ring</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handle6FigureRing}>
                <FaStar /> <span>6 Figure Ring</span>
              </button>

              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handle4FiguresRing}>
                <FaStar /> <span>4 Figure Ring</span>
              </button> */}
                  <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handlePaltiTandula}>
                <FaStar /> <FaStar /> <FaStar />  <span>Palti Tandula</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handle3FigureRingWithX}>
              <FaStar /> <FaStar /> <FaStar /> <span>12 tandulla</span>
              </button>
            </div>
            {/* Right Column */}
            <div className="w-1/2">


              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handleAKR2Figure}>
                 <span>F+M+B AKR</span>
              </button>
              {/* <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handleAKR3Figure}>
                <FaMoon /> <span>3 figure AKR</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handleAKR4Figure}>
                <FaMoon /> <span>4 Figure AKR</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handleAKR5Figure}>
                <FaMoon /> <span>5 Figure AKR</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handleAKR6Figure}>
                <FaMoon /> <span>6 Figure AKR</span>
              </button> */}
              <button
                className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2"
                onClick={handlePaltiAKR}
              >
                 <FaStar /> <FaStar /> <span>Palti AKR</span>
              </button>

              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handleRingPlusAKR}>
                 <span>Ring + AKR</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 m-2" onClick={handle4FigurePacket}>
              <FaStar /> <FaStar />   <FaStar /> <FaStar />   <span>Pangora palti</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

export default Center