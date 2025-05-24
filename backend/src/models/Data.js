import mongoose from "mongoose";

const dataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    timeSlot: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    data: [
        {
            uniqueId: {
                type: String,
                required: true,
            },
            firstPrice: {
                type: Number,
                required: true,
            },
            secondPrice: {
                type: Number,
                required: true,
            },
        },
    ],

     // 
}, {
    timestamps: true,
});

export default mongoose.model("Data", dataSchema);
