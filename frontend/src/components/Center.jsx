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

  // State for storing permutations
  const [permutations, setPermutations] = useState([]);  // we will set permutation in the table entreis

  useEffect(() => {   // this iuse in table 
    if (drawDate && drawTime) {
      getAndSetVoucherData();
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

  const akra = [], tandola = [], pangora = [];

  allVoucherRows.forEach(({ number, first, second }) => {
    if (
      /^\d{2}$/.test(number) ||
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

  const grandTotals = {
    first: 0,
    second: 0,
    net: 0,
    commission: 0,
    payable: 0,
  };

  const renderSection = (title, rows, startY = 70) => {
    if (rows.length === 0) return startY;

    const rowHeight = 8;
    const colWidths = [50, 40, 40];
    let y = startY;

    const totals = calculateTotals(rows);
    const net = totals.first + totals.second;

    let commissionRate = 0;
    if (title === "AKRA") commissionRate = 0.20;
    else if (title === "TANDOLA") commissionRate = 0.20;
    else if (title === "PANGORA") commissionRate = 0.40;

    const commissionAmount = net * commissionRate;
    const netPayable = net - commissionAmount;

    grandTotals.first += totals.first;
    grandTotals.second += totals.second;
    grandTotals.net += net;
    grandTotals.commission += commissionAmount;
    grandTotals.payable += netPayable;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`${title} (${rows.length} entries)`, 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`First Total: ${totals.first}`, 14, y);
    doc.text(`Second Total: ${totals.second}`, 70, y);
    doc.text(`Net: ${net}`, 140, y);
    y += 5;
    doc.text(`Commission (${commissionRate * 100}%): -${commissionAmount.toFixed(2)}`, 14, y);
    doc.text(`Net Payable: ${netPayable.toFixed(2)}`, 140, y);
    y += 10;

    const x = 14;
    doc.setFont("helvetica", "bold");
    doc.rect(x, y, colWidths[0], rowHeight);
    doc.text("Number", x + 2, y + 6);
    doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
    doc.text("First", x + colWidths[0] + 2, y + 6);
    doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
    doc.text("Second", x + colWidths[0] + colWidths[1] + 2, y + 6);
    y += rowHeight;

    doc.setFont("helvetica", "normal");

    rows.forEach(([num, f, s]) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(title + " (cont...)", 14, y);
        y += 10;
        doc.setFontSize(10);
        doc.rect(x, y, colWidths[0], rowHeight);
        doc.text("Number", x + 2, y + 6);
        doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
        doc.text("First", x + colWidths[0] + 2, y + 6);
        doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
        doc.text("Second", x + colWidths[0] + colWidths[1] + 2, y + 6);
        y += rowHeight;
        doc.setFont("helvetica", "normal");
      }

      doc.rect(x, y, colWidths[0], rowHeight);
      doc.text(num.toString(), x + 2, y + 6);
      doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
      doc.text(f.toString(), x + colWidths[0] + 2, y + 6);
      doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
      doc.text(s.toString(), x + colWidths[0] + colWidths[1] + 2, y + 6);
      y += rowHeight;
    });

    return y + 10;
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

    const commissionFirst = (grandFirst / netTotal) * grandTotals.commission;
    const commissionSecond = (grandSecond / netTotal) * grandTotals.commission;

    const netFirst = grandFirst - commissionFirst;
    const netSecond = grandSecond - commissionSecond;

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
    y += rowHeight;
    drawRow(y, "Commission", -commissionFirst, -commissionSecond, -grandTotals.commission);
    y += rowHeight;
    drawRow(y, "Net Payable", netFirst, netSecond, grandTotals.payable);
  };

  addHeader();
  let nextY = 70;
  nextY = renderSection("AKRA", akra, nextY);
  nextY = renderSection("TANDOLA", tandola, nextY);
  nextY = renderSection("PANGORA", pangora, nextY);
  renderGrandTotals(nextY);

  doc.save("Ledger_Sheet_RLC.pdf");
  toast.success("Ledger PDF downloaded successfully!");
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
          <h3>F:9876</h3>
          <h3>S:2362, 7612, 8722,</h3>
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