import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const Reports = () => {
  const userData = useSelector((state) => state.user);
  const token = userData?.token || localStorage.getItem('token');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [drawDate, setDrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [drawTime, setDrawTime] = useState('11 AM');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ledger, setLedger] = useState("LEDGER");
  const [winningNumbers, setWinningNumbers] = useState([
    { number: "2453", color: [255, 0, 0], type: "first" },    // Red (RGB)
    { number: "1157", color: [0, 0, 255], type: "second" },   // Blue (RGB)
    { number: "2560", color: [0, 0, 255], type: "second" },   // Blue (RGB)
  ]);
  const [firstPrizeLimit, setFirstPrizeLimit] = useState(0);
  const [secondPrizeLimit, setSecondPrizeLimit] = useState(0);
  const [enablePrizeFilter, setEnablePrizeFilter] = useState(true);
  const [isDemandOverlimit, setIsDemandOverlimit] = useState(false);

  // Fetch clients for this user
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('/api/v1/users/distributor-users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(response.data || []);
      } catch (error) {
        toast.error('Failed to fetch clients');
      }
    };
    fetchClients();
  }, [token]);

  useEffect(() => {
    if (drawDate && drawTime) {
      // getAndSetVoucherData();
      getWinningNumbers(drawDate, drawTime); 
      // getDemandOverlimit(drawDate, drawTime);
    }
  }, [drawDate, drawTime]);

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
        if (response.data || response.data.winningNumbers) {
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
  // Fetch entries for selected client/date/time
  const fetchClientEntries = async () => {
    if (!selectedClient) {
      toast.warning('Please select a client');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/data/get-client-data', {
        params: {
          date: drawDate,
          timeSlot: drawTime,
          category: "general",
          userId: selectedClient,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      // Flatten entries for table
      const allEntries = response.data.data?.flatMap(record =>
        record.data.map(item => ({
          parentId: record._id,
          objectId: item._id,
          no: item.uniqueId,
          f: item.firstPrice,
          s: item.secondPrice,
        }))
      ) || [];
      setEntries(allEntries);
    } catch (error) {
      toast.error('Failed to fetch report');
      setEntries([]);
    } finally {
      setLoading(false);
    }
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
            // serial: index + 1, // creates a unique-enough ID without needing global index
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

  const fetchVoucherData = async (selectedDate, selectedTimeSlot, category = "general") => {
      if (!selectedClient) {
        toast.warning('Please select a client');
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
  
        const response = await axios.get("/api/v1/data/get-client-data", {
          params: {
            date: selectedDate,
            timeSlot: selectedTimeSlot,
            category: category,
            userId: selectedClient,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data.data;
      } catch (error) {
        toast.error((error.response?.data?.error));
        return [];
      }
  };

  const generateVoucherPDF = async (category) => {
      const fetchedEntries = await fetchVoucherData(drawDate, drawTime, category);
      if (fetchedEntries.length === 0) {
        toast.info("No Record found..");
        return;
      }
    
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
    
      // Get all voucher rows and categorize them
      const allVoucherRows = fetchedEntries
        .filter(entry => entry.timeSlot === drawTime)
        .flatMap(entry => entry.data.map(item => ({
          number: item.uniqueId,
          first: item.firstPrice,
          second: item.secondPrice
        })));
    
      // Split entries into categories (same logic as in generateLedgerPDF)
      const hinsa = [], akra = [], tandola = [], pangora = [];
    
      allVoucherRows.forEach(({ number, first, second }) => {
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
    
      const totalEntries = allVoucherRows.length;
    
      // Calculate totals for each section
      const calculateSectionTotals = (rows) => {
        return rows.reduce(
          (acc, row) => {
            acc.firstTotal += row[1];
            acc.secondTotal += row[2];
            return acc;
          },
          { firstTotal: 0, secondTotal: 0 }
        );
      };
    
      const hinsaTotals = calculateSectionTotals(hinsa);
      const akraTotals = calculateSectionTotals(akra);
      const tandolaTotals = calculateSectionTotals(tandola);
      const pangoraTotals = calculateSectionTotals(pangora);
    
      const grandTotals = {
        firstTotal: hinsaTotals.firstTotal + akraTotals.firstTotal + tandolaTotals.firstTotal + pangoraTotals.firstTotal,
        secondTotal: hinsaTotals.secondTotal + akraTotals.secondTotal + tandolaTotals.secondTotal + pangoraTotals.secondTotal
      };
      const grandTotal = grandTotals.firstTotal + grandTotals.secondTotal;
    
      const addHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Voucher Sheet by Sections", pageWidth / 2, 15, { align: "center" });
    
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Dealer Name: ${selectedClient ?? userData?.user.username}`, 14, 30);
        doc.text(`City: ${userData?.user.city}`, 14, 40);
        doc.text(`Draw Date: ${drawDate}`, 14, 50);
        doc.text(`Draw Time: ${drawTime}`, 14, 60);
        doc.text(`Total Entries: ${totalEntries}`, 14, 70);
    
        // Add grand totals
        doc.text(`First Total: ${grandTotals.firstTotal}`, 110, 50);
        doc.text(`Second Total: ${grandTotals.secondTotal}`, 110, 60);
        doc.text(`Grand Total: ${grandTotal}`, 110, 70);
      };
    
      // Function to render each section
      const renderSection = (title, rows, startY = 80) => {
        if (rows.length === 0) return startY;
    
        const rowHeight = 7;
        const colWidths = [20, 15, 15];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const gapBetweenTables = 8;
        const xStart = 14;
    
        let y = startY;
    
        // Section header with totals
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(`${title} (${rows.length} entries)`, 14, y);
        y += 6;
    
        const sectionTotals = calculateSectionTotals(rows);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`First: ${sectionTotals.firstTotal}`, 14, y);
        doc.text(`Second: ${sectionTotals.secondTotal}`, 60, y);
        doc.text(`Total: ${sectionTotals.firstTotal + sectionTotals.secondTotal}`, 110, y);
        y += 10;
    
        // Split rows into three columns for better layout
        const thirdPoint = Math.ceil(rows.length / 3);
        const leftRows = rows.slice(0, thirdPoint);
        const middleRows = rows.slice(thirdPoint, thirdPoint * 2);
        const rightRows = rows.slice(thirdPoint * 2);
    
        // Table positions
        const leftX = xStart;
        const middleX = leftX + tableWidth + gapBetweenTables;
        const rightX = middleX + tableWidth + gapBetweenTables;
    
        // Function to draw table header
        const drawTableHeader = (x, y) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
    
          doc.rect(x, y, colWidths[0], rowHeight);
          doc.text("Number", x + 2, y + 5);
    
          doc.rect(x + colWidths[0], y, colWidths[1], rowHeight);
          doc.text("First", x + colWidths[0] + 2, y + 5);
    
          doc.rect(x + colWidths[0] + colWidths[1], y, colWidths[2], rowHeight);
          doc.text("Second", x + colWidths[0] + colWidths[1] + 2, y + 5);
    
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
          if (currentY > pageHeight - 20) {
            doc.addPage();
            
            // Add section header on new page
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text(title + " (continued...)", 14, 20);
            
            // Reset Y position and redraw ALL table headers
            currentY = 35;
            
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
            const [number, first, second] = leftRows[i];
            const entryColor = getEntryColor(number);
    
            doc.rect(leftX, currentY, colWidths[0], rowHeight);
            doc.setTextColor(entryColor[0], entryColor[1], entryColor[2]);
            doc.text(number.toString(), leftX + 2, currentY + 5);
    
            doc.rect(leftX + colWidths[0], currentY, colWidths[1], rowHeight);
            doc.text(first.toString(), leftX + colWidths[0] + 2, currentY + 5);
            doc.rect(leftX + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight);
            doc.text(second.toString(), leftX + colWidths[0] + colWidths[1] + 2, currentY + 5);
            doc.setTextColor(0, 0, 0);
          }
    
          // Draw middle table row
          if (i < middleRows.length) {
            const [number, first, second] = middleRows[i];
            const entryColor = getEntryColor(number);
    
            doc.rect(middleX, currentY, colWidths[0], rowHeight);
            doc.setTextColor(entryColor[0], entryColor[1], entryColor[2]);
            doc.text(number.toString(), middleX + 2, currentY + 5);
    
            doc.rect(middleX + colWidths[0], currentY, colWidths[1], rowHeight);
            doc.text(first.toString(), middleX + colWidths[0] + 2, currentY + 5);
            doc.rect(middleX + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight);
            doc.text(second.toString(), middleX + colWidths[0] + colWidths[1] + 2, currentY + 5);
            doc.setTextColor(0, 0, 0);
          }
    
          // Draw right table row
          if (i < rightRows.length) {
            const [number, first, second] = rightRows[i];
            const entryColor = getEntryColor(number);
    
            doc.rect(rightX, currentY, colWidths[0], rowHeight);
            doc.setTextColor(entryColor[0], entryColor[1], entryColor[2]);
            doc.text(number.toString(), rightX + 2, currentY + 5);
    
            doc.rect(rightX + colWidths[0], currentY, colWidths[1], rowHeight);
            doc.text(first.toString(), rightX + colWidths[0] + 2, currentY + 5);
            doc.rect(rightX + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight);
            doc.text(second.toString(), rightX + colWidths[0] + colWidths[1] + 2, currentY + 5);
            doc.setTextColor(0, 0, 0);
          }
    
          currentY += rowHeight;
        }
    
        return currentY + 15; // Extra space between sections
      };
    
      addHeader();
      let nextY = 85;
    
      // Render each section if it has entries
      if (hinsa.length > 0) {
        nextY = renderSection("HINSA", hinsa, nextY);
      }
      if (akra.length > 0) {
        nextY = renderSection("AKRA", akra, nextY);
      }
      if (tandola.length > 0) {
        nextY = renderSection("TANDOLA", tandola, nextY);
      }
      if (pangora.length > 0) {
        nextY = renderSection("PANGORA", pangora, nextY);
      }
    
      doc.save("Voucher_Sheet_by_Sections_RLC.pdf");
      toast.success("Voucher PDF by sections downloaded successfully!");
  };

  const generateLedgerPDF = async () => {
  
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
        doc.text(`Dealer Name: ${selectedClient ?? userData?.user.username}`, 14, 30);
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

  
      const renderSection = (title, rows, startY = 80) => {
        if (rows.length === 0) return startY;
  
        const rowHeight = 8;
        const colWidths = [20, 17, 17];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        let y = startY;
  
        const totals = calculateTotals(rows);
        const net = totals.first + totals.second;
  
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
      doc.text(`Dealer: ${selectedClient ?? userData?.user.username}`, 14, 30);
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
      });
  
      doc.save("Daily_Bill_RLC.pdf");
      toast.success("Daily Bill PDF downloaded successfully!");
  };

  // PDF export (simple)
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
      else if(ledger === "DEMAND"){
        await generateVoucherPDF("demand");
      }
      else if(ledger === "OVER LIMIT"){
        await generateVoucherPDF("overlimit");
      }
      else {
        toast.error("Please select a valid ledger type.");
  
      }
  };

  function splitEntriesByLimit(entries, firstLimit, secondLimit) {
    const demand = [];
    const overlimit = [];
  
    entries.forEach(entry => {
      const demandFirst = firstLimit > 0 ? Math.min(entry.f, firstLimit) : entry.f;
      const demandSecond = secondLimit > 0 ? Math.min(entry.s, secondLimit) : entry.s;
      // const overFirst = entry.f > firstLimit ? entry.f - firstLimit : 0;
      // const overSecond = entry.s > secondLimit ? entry.s - secondLimit : 0;
  
      if (demandFirst > 0 || demandSecond > 0) {
        demand.push({
          uniqueId: entry.no,
          firstPrice: demandFirst,
          secondPrice: demandSecond
        });
      }
      if ((firstLimit > 0 && entry.f > firstLimit) || (secondLimit > 0 && entry.s > secondLimit)) {
        overlimit.push({
          uniqueId: entry.no,
          firstPrice: entry.f > firstLimit ? entry.f - firstLimit : 0,
          secondPrice: entry.s > secondLimit ? entry.s - secondLimit : 0
        });
      }
    });
  
    return { demand, overlimit };
  }
  
  
  const saveOverLimit = async () => {
      if(isDemandOverlimit && !selectedClient){
        toast.warning("Demand/Overlimit entries already exist for this draw time.");
        return;
      }
      try {
        await getAndSetVoucherData();
        console.log("first prizeLimit:", firstPrizeLimit);
        console.log("second prizeLimit:", secondPrizeLimit);
        const { demand, overlimit } = splitEntriesByLimit(entries, firstPrizeLimit, secondPrizeLimit);
        console.log("Demand Entries:", demand);
        console.log("Overlimit Entries:", overlimit);
        const token = localStorage.getItem("token");
    
        // Save demand entries
        if (demand.length > 0) {
          await axios.post(`/api/v1/data/add-overlimit-data?userId=${selectedClient}`, {
            timeSlot: drawTime,
            data: demand,
            category: "demand",
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
    
        // Save overlimit entries
        if (overlimit.length > 0) {
          await axios.post(`/api/v1/data/add-overlimit-data?userId=${selectedClient}`, {
            timeSlot: drawTime,
            data: overlimit,
            category: "overlimit",
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
    
        toast.success("Demand and Overlimit entries saved!");
        // await getAndSetVoucherData();
      } catch (error) {
        console.error("Error saving over limit:", error);
        toast.error("Failed to save overlimit/demand entries");
      }
    };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Client Reports</h2>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label className="block mb-1">Date</label>
          <input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)} className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600" />
        </div>
        <div>
          <label className="block mb-1">Time</label>
          <select value={drawTime} onChange={e => setDrawTime(e.target.value)} className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
            {[...Array(13)].map((_, i) => {
              const hour = 11 + i;
              const period = hour >= 12 ? 'PM' : 'AM';
              const formattedHour = hour > 12 ? hour - 12 : hour;
              const time = `${formattedHour === 0 ? 12 : formattedHour} ${period}`;
              return <option key={time} value={time}>{time}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="block mb-1">Client</label>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
            <option value="">Select Client</option>
            {clients.map(client => (
              <option key={client._id} value={client._id}>{client.username}</option>
            ))}
          </select>
        </div>
        <div>
            <label className="block mb-1">Report</label>
            <select
                className="bg-gray-700 text-gray-100 px-3 py-2 rounded-lg border border-gray-600 flex-1"
                value={ledger}
                onChange={(e) => setLedger(e.target.value)}
              >
              <option>LEDGER</option>
              <option>DAILY BILL</option>
              <option>VOUCHER</option>
              <option>DEMAND</option>
              <option>OVER LIMIT</option>
            </select>
        </div>
        <div className="flex items-end">
          <button onClick={handleDownloadPDF} className="bg-green-600 px-4 py-2 rounded">Download</button>
        </div>
      </div>
      {/* {loading ? <div>Loading...</div> : (
        <>
          <div className="bg-gray-800 rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Entries</h3>
            {entries.length === 0 ? <div>No data found</div> : (
              <ul className="space-y-2">
                {entries.map((entry, idx) => (
                  <li key={entry.objectId || idx} className="border-b border-gray-700 pb-2">
                    <div className="font-bold">{idx + 1}. {entry.no}</div>
                    <div className="text-sm text-gray-300">F: {entry.f} &nbsp; S: {entry.s}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )} */}
      <div className="text-lg font-semibold flex items-center space-x-2">
        <input
          type="checkbox"
          checked={enablePrizeFilter}
          onChange={(e) => setEnablePrizeFilter(e.target.checked)}
          className="w-4 h-4"
        />
        <span>Enable Prize Filter</span>
      </div>

      {/* Prize Limit Inputs - Only show when filter is enabled */}
      {enablePrizeFilter && (
        <div className="space-y-2 bg-gray-700 p-3 rounded-lg border border-gray-600">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium min-w-[100px]">First Prize Limit:</label>
            <input
              type="number"
              value={firstPrizeLimit}
              onChange={(e) => setFirstPrizeLimit(Number(e.target.value))}
              className="bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 flex-1"
              placeholder="Enter limit"
              min="0"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium min-w-[100px]">Second Prize Limit:</label>
            <input
              type="number"
              value={secondPrizeLimit}
              onChange={(e) => setSecondPrizeLimit(Number(e.target.value))}
              className="bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 flex-1"
              placeholder="Enter limit"
              min="0"
            />
          </div>
          <div className="text-xs float-end">
            <button className='bg-blue-600 px-4 py-2 rounded-md' onClick={saveOverLimit}>Save</button>
          </div>
          <div className="text-xs text-gray-400">
            * Only entries with prizes below these limits will be included
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
