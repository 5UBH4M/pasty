import crypto from "crypto";
import Gist from "../models/Gist.js";

// Generate a random 4-character alphanumeric ID
export const generateId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    const randomBytes = crypto.randomBytes(4);

    for (let i = 0; i < 4; i++) {
        result += chars.charAt(randomBytes[i] % chars.length);
    }
    return result;
};

// Check if ID already exists and generate a unique one
export const generateUniqueId = async (maxAttempts = 50) => {
    let id = generateId();
    let attempts = 0;

    while (attempts < maxAttempts) {
        const existing = await Gist.findOne({ id }).lean();
        if (!existing) {
            return id;
        }
        id = generateId();
        attempts++;
    }

    // More descriptive error for debugging
    throw new Error(`Unable to generate unique ID after ${maxAttempts} attempts`);
};
