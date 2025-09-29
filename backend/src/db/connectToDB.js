import mongoose from "mongoose";

export default async function connectDB() {
    try {
        mongoose.set("strictQuery", true);
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/Pasty";

        await mongoose.connect(mongoUri);
        console.log("🥳 Connected to MongoDB successfully");
    } catch (error) {
        if (error instanceof Error) {
            console.error("😕 Error connecting to MongoDB:", error.message);
        } else {
            console.error("😕 An unexpected error occurred:", error);
        }
        process.exit(1);
    }
}
