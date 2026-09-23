import crypto from "crypto";
import Room, { MAX_ROOM_SIZE } from "../models/Room.js";
import RoomEntry from "../models/RoomEntry.js";

// Generate a unique 6-digit alphanumeric code
const generateRoomCode = async () => {
    for (let i = 0; i < 50; i++) {
        const code = crypto.randomBytes(4).toString("hex").slice(0, 6).toLowerCase().padEnd(6, "0");
        const exists = await Room.findOne({ code });
        if (!exists) return code;
    }
    throw new Error("Could not generate unique room code");
};

const processUploads = (reqFiles, fieldName) => {
    const items = reqFiles?.[fieldName] || [];
    return items.map((file) => ({
        data: file.buffer,
        contentType: file.mimetype,
        name: file.originalname,
        size: file.size,
    }));
};

// POST /api/rooms — create a room
export const createRoom = async (req, res) => {
    try {
        const { name = "Untitled Room" } = req.body;
        let ttlHours = parseInt(req.body.ttlHours) || 168;
        ttlHours = Math.max(1, Math.min(168, ttlHours));

        const code = await generateRoomCode();
        const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

        const room = new Room({
            code,
            name: typeof name === "string" ? name.trim().slice(0, 100) : "Untitled Room",
            ttlHours,
            totalSize: 0,
            expiresAt,
        });

        await room.save();

        res.status(201).json({
            success: true,
            data: {
                code: room.code,
                name: room.name,
                ttlHours: room.ttlHours,
                totalSize: 0,
                maxSize: MAX_ROOM_SIZE,
                createdAt: room.createdAt,
                expiresAt: room.expiresAt,
            },
        });
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// GET /api/rooms/:code — get room + entries
export const getRoom = async (req, res) => {
    try {
        const { code } = req.params;

        if (!code || code.length !== 6) {
            return res.status(400).json({ success: false, message: "Invalid room code" });
        }

        const room = await Room.findOne({
            code: code.toLowerCase(),
            expiresAt: { $gt: new Date() },
        });

        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found or expired" });
        }

        // Get entries without binary data
        const entries = await RoomEntry.find({
            roomCode: room.code,
            expiresAt: { $gt: new Date() },
        })
            .select("-screenshots.data -files.data")
            .sort({ createdAt: -1 });

        const entriesData = entries.map((entry) => ({
            id: entry._id,
            title: entry.title,
            code: entry.code,
            entrySize: entry.entrySize,
            screenshots: entry.screenshots.map((s, i) => ({
                index: i,
                name: s.name,
                size: s.size,
                contentType: s.contentType,
                url: `/api/rooms/${room.code}/entries/${entry._id}/screenshots/${i}`,
            })),
            files: entry.files.map((f, i) => ({
                index: i,
                name: f.name,
                size: f.size,
                contentType: f.contentType,
                url: `/api/rooms/${room.code}/entries/${entry._id}/files/${i}`,
            })),
            createdAt: entry.createdAt,
        }));

        res.status(200).json({
            success: true,
            data: {
                code: room.code,
                name: room.name,
                ttlHours: room.ttlHours,
                totalSize: room.totalSize,
                maxSize: MAX_ROOM_SIZE,
                entries: entriesData,
                createdAt: room.createdAt,
                expiresAt: room.expiresAt,
            },
        });
    } catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/rooms/:code/entries — add an entry
export const addEntry = async (req, res) => {
    try {
        const { code } = req.params;
        const { title = "Untitled" } = req.body;
        const codeContent = (req.body.code && typeof req.body.code === "string") ? req.body.code.trim() : "";

        const room = await Room.findOne({
            code: code.toLowerCase(),
            expiresAt: { $gt: new Date() },
        });

        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found or expired" });
        }

        const screenshots = processUploads(req.files, "screenshots");
        const files = processUploads(req.files, "files");

        if (!codeContent && screenshots.length === 0 && files.length === 0) {
            return res.status(400).json({ success: false, message: "Please provide code, screenshots, or files" });
        }

        // Calculate entry upload size
        const entrySize = [...screenshots, ...files].reduce((sum, f) => sum + f.size, 0);

        if (room.totalSize + entrySize > MAX_ROOM_SIZE) {
            const remaining = MAX_ROOM_SIZE - room.totalSize;
            return res.status(400).json({
                success: false,
                message: `Room storage full. ${(remaining / 1024 / 1024).toFixed(1)}MB remaining.`,
            });
        }

        const entry = new RoomEntry({
            roomCode: room.code,
            title: typeof title === "string" ? title.trim().slice(0, 100) : "Untitled",
            code: codeContent,
            screenshots,
            files,
            entrySize,
            expiresAt: room.expiresAt,
        });

        await entry.save();

        // Update room total size
        room.totalSize += entrySize;
        await room.save();

        res.status(201).json({
            success: true,
            data: {
                id: entry._id,
                title: entry.title,
                entrySize: entry.entrySize,
                screenshotCount: entry.screenshots.length,
                fileCount: entry.files.length,
                createdAt: entry.createdAt,
            },
            roomTotalSize: room.totalSize,
        });
    } catch (error) {
        console.error("Error adding entry:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// GET /api/rooms/:code/entries/:entryId/screenshots/:index
export const getEntryScreenshot = async (req, res) => {
    try {
        const { entryId, index } = req.params;
        const idx = parseInt(index);

        const entry = await RoomEntry.findOne({
            _id: entryId,
            expiresAt: { $gt: new Date() },
        }).select("screenshots");

        if (!entry || !entry.screenshots[idx]) {
            return res.status(404).json({ success: false, message: "Screenshot not found" });
        }

        const ss = entry.screenshots[idx];
        res.set("Content-Type", ss.contentType);
        res.set("Content-Length", ss.size);
        res.set("Cache-Control", "public, max-age=86400");
        res.send(ss.data);
    } catch (error) {
        console.error("Error serving room screenshot:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// GET /api/rooms/:code/entries/:entryId/files/:index
export const getEntryFile = async (req, res) => {
    try {
        const { entryId, index } = req.params;
        const idx = parseInt(index);

        const entry = await RoomEntry.findOne({
            _id: entryId,
            expiresAt: { $gt: new Date() },
        }).select("files");

        if (!entry || !entry.files[idx]) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        const file = entry.files[idx];
        res.set("Content-Type", file.contentType);
        res.set("Content-Length", file.size);
        res.set("Content-Disposition", `attachment; filename="${encodeURIComponent(file.name)}"`);
        res.set("Cache-Control", "public, max-age=86400");
        res.send(file.data);
    } catch (error) {
        console.error("Error serving room file:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
