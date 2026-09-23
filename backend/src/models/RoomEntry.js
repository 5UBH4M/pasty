import mongoose from "mongoose";

const RoomEntrySchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        index: true,
    },
    title: {
        type: String,
        default: "Untitled",
        maxLength: 100,
        trim: true,
    },
    code: {
        type: String,
        default: "",
        maxLength: 100000,
    },
    screenshots: [{
        data: { type: Buffer, required: true },
        contentType: { type: String, required: true },
        name: { type: String, required: true },
        size: { type: Number, required: true },
    }],
    files: [{
        data: { type: Buffer, required: true },
        contentType: { type: String, required: true },
        name: { type: String, required: true },
        size: { type: Number, required: true },
    }],
    entrySize: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});

RoomEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RoomEntry = mongoose.models.RoomEntry || mongoose.model("RoomEntry", RoomEntrySchema);

export default RoomEntry;
