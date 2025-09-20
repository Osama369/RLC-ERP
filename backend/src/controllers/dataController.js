import Data from "../models/Data.js";
import User from "../models/User.js";
import Winner from "../models/Winner.js";

const addDataForTimeSlot = async (req, res) => {
    const { timeSlot, data, category } = req.body;
    try {
        // Calculate total amount from firstPrice and secondPrice
        const totalAmount = data.reduce((sum, item) => {
            return sum + item.firstPrice + item.secondPrice;
        }, 0);
        // Find the user and check if they have sufficient balance
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.balance < totalAmount) {
            return res.status(400).json({ 
                error: "Insufficient balance", 
                currentBalance: user.balance,
                requiredAmount: totalAmount 
            });
        }
        const newData = new Data({ userId : req.user.id, timeSlot, category, data, date : new Date().toISOString().slice(0, 10) });
        await newData.save();
        // Deduct the total amount from user's balance
        user.balance -= totalAmount;
        await user.save();
        
        res.status(201).json({ message: "Data added successfully" , newData });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const addOverlimitData = async (req, res) => {
    const { timeSlot, data, category } = req.body;
    const userId = req.query.userId || req.user.id; 
    try {
        // Find the user and check if they have sufficient balance
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const newData = new Data({ userId : userId, timeSlot, category, data, date : new Date().toISOString().slice(0, 10) });
        await newData.save();
        
        res.status(201).json({ message: "Data added successfully" , newData });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


// getDataForDate is used to get data for a specific date or slot
// and is used in the frontend to get data for a specific date or slot
const getDataForDate = async (req, res) => {   
    const { date, timeSlot, category } = req.query;
  
    if (!date || !timeSlot) {
      return res.status(400).json({ error: "Both date and timeSlot are required" });
    }
  
    try {
      const data = await Data.find({
        userId: req.user.id, // Use userId from query if provided (for distributors fetching client data)
        date,
        timeSlot,
        category: category || "general" // default to "general" if not provided
      });
  
      if (!data || data.length === 0) {
        return res.status(404).json({ error: "No data found for the given date and timeSlot" });
      }
  
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };  


const deleteDataObjectById = async (req , res) => {
    const { id } = req.params;

    if(!id){
        return res.status(400).json({ error: "Id is required" });
    }

    try {
        const data = await Data.findById(id);
        if(!data){
            return res.status(404).json({ error: "No data associated to this id" });
        }
        if (data.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized: You can only delete your own data" });
        }

        const refundAmount = data.data.reduce((sum, item) => {
            return sum + item.firstPrice + item.secondPrice;
        }, 0);
        console.log("Refund Amount: ", refundAmount);
        // Find the user to refund the balance
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete the data
        await Data.findByIdAndDelete(id);

        // Refund the amount to user's balance
        user.balance += refundAmount;
        await user.save();
        return res.status(200).json({ message: "Data deleted successfully" });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

// In your dataController.js
const deleteIndividualEntries = async (req, res) => {
    const { entryIds } = req.body; // Array of objectIds to delete
    console.log("Entry IDs to delete:", entryIds);
    console.log("User ID:", req.user.id);
    if (!entryIds || !Array.isArray(entryIds)) {
        return res.status(400).json({ error: "Entry IDs array is required" });
    }

    try {
        let totalRefund = 0;
        const deletedEntries = [];

        // Process each entry ID
        for (const entryId of entryIds) {
            // Find the parent document containing this entry
            const parentDocument = await Data.findOne({
                "data._id": entryId,
                userId: req.user.id
            });

            if (!parentDocument) {
                continue; // Skip if not found or doesn't belong to user
            }

            // Find the specific entry to calculate refund
            const entryToDelete = parentDocument.data.find(item => item._id.toString() === entryId);
            if (entryToDelete) {
                totalRefund += entryToDelete.firstPrice + entryToDelete.secondPrice;
                deletedEntries.push(entryToDelete);
            }

            // Remove the entry from the data array
            await Data.updateOne(
                { _id: parentDocument._id },
                { $pull: { data: { _id: entryId } } }
            );

            // Check if the document has no more entries, if so delete the whole document
            const updatedDocument = await Data.findById(parentDocument._id);
            if (updatedDocument.data.length === 0) {
                await Data.findByIdAndDelete(parentDocument._id);
            }
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Refund the balance to user
        if (totalRefund > 0) {
            user.balance += totalRefund;
            await user.save();
        }

        return res.status(200).json({
            message: "Selected entries deleted successfully",
            deletedCount: deletedEntries.length,
            refundAmount: totalRefund,
            newBalance: user?.balance
        });

    } catch (error) {
        console.error("Error deleting individual entries:", error);
        return res.status(500).json({ error: error.message });
    }
};

const getAllDocuments = async (req , res) => {
    try {
        const data = await Data.find();
        if(!data){
            return res.status(404).json({ error: "No data associated to this user" });
        }
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const getWinningNumbers = async (req, res) => {
    const { date, timeSlot } = req.query;
    if (!date || !timeSlot) {
        return res.status(400).json({ error: "Both date and timeSlot are required" });
    }
    try {
        const data = await Winner.findOne({
            date,
            timeSlot,
        });

        if (!data) {
            return res.status(404).json({ error: "No data found for the given date and timeSlot" });
        }

        // Assuming the winning numbers are stored in the WinningNumbers field
        const winningNumbers = data.WinningNumbers.map(item => ({
            number: item.number,
            type: item.type
        }));

        res.status(200).json({ winningNumbers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const setWinningNumbers = async (req, res) => {
    const { date, timeSlot, winningNumbers } = req.body;
    if (!date || !timeSlot || !winningNumbers || !Array.isArray(winningNumbers)) {
        return res.status(400).json({ error: "Date, timeSlot, and winningNumbers are required" });
    }
    try {
        // Check if winning numbers already exist for the given date and timeSlot
        const existingWinner = await Winner.findOne({ date, timeSlot });
        if (existingWinner) {
            return res.status(400).json({ error: "Winning numbers already set for this date and timeSlot" });
        }

        const newWinner = new Winner({
            userId: req.user.id,
            date,
            timeSlot,
            WinningNumbers: winningNumbers.map(num => ({
                number: num.number,
                type: num.type
            }))
        });

        await newWinner.save();
        res.status(201).json({ message: "Winning numbers set successfully", newWinner });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getDemandOverlimit = async (req, res) => {
    const { date, timeSlot } = req.query;
    if (!date || !timeSlot) {
        return res.status(400).json({ error: "Both date and timeSlot are required" });
    } 
    try {
        const data = await Data.exists({
            userId: req.user.id,
            date,
            timeSlot,
            category: "overlimit"
          });
        if (!data) {
            return res.status(200).json({ message: "No overlimit data found for the given date and timeSlot", exists: false });
        }
        res.status(200).json({ message: "Overlimit data exists for the given date and timeSlot" , exists: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getCombinedVoucherData = async (req, res) => {
    try {
      const { date, timeSlot, category } = req.query;
      const userId = req.user.id;
  
      if (!date || !timeSlot) {
        return res.status(400).json({ error: "Date and timeSlot are required" });
      }
  
      // Get user's own data
      const userEntries = await Data.find({
        userId: userId,
        date: date,
        timeSlot: timeSlot,
        category: category || "general"
      }).populate('userId', 'username dealerId');
  
      // Get user's clients data
      const clients = await User.find({ createdBy: userId });
      const clientIds = clients.map(client => client._id);
      
      const clientEntries = await Data.find({
        userId: { $in: clientIds },
        date: date,
        timeSlot: timeSlot,
        category: category || "general"
      }).populate('userId', 'username dealerId');
  
      // Combine all entries
      const allEntries = [...userEntries, ...clientEntries];
  
      res.status(200).json({
        success: true,
        data: allEntries,
        userEntries: userEntries.length,
        clientEntries: clientEntries.length,
        totalEntries: allEntries.length,
        clientIds: clientIds
      });
  
    } catch (error) {
      console.error("Error fetching combined voucher data:", error);
      res.status(500).json({ error: error.message });
    }
};

const getDataForClient = async (req, res) => {   
    const { date, timeSlot, category, userId } = req.query;
  
    if (!date || !timeSlot) {
      return res.status(400).json({ error: "Both date and timeSlot are required" });
    }
  
    try {
      const data = await Data.find({
        userId: userId, // Use userId from query if provided (for distributors fetching client data)
        date,
        timeSlot,
        category: category || "general" // default to "general" if not provided
      });
      console.log("Data for client:", data);
      if (!data || data.length === 0) {
        return res.status(404).json({ error: "No data found for the given date and timeSlot" });
      }
  
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
}; 

export {
    addDataForTimeSlot,
    getDataForDate,
    addOverlimitData,
    getDemandOverlimit,
    deleteDataObjectById,
    getAllDocuments,
    getWinningNumbers,
    setWinningNumbers,
    deleteIndividualEntries,
    getCombinedVoucherData,
    getDataForClient
}

