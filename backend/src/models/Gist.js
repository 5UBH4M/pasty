import mongoose from "mongoose";

const GistSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    length: 4,
  },
  code: {
    type: String,
    required: true,
    maxLength: 100000,
  },
  title: {
    type: String,
    default: "Untitled",
    maxLength: 100,
    trim: true,
  },
  fileName: {
    type: String,
    default: "untitled.txt",
    maxLength: 50,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from creation
  },
});

// Create index for automatic cleanup of expired documents
GistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Gist = mongoose.models.Gist || mongoose.model("Gist", GistSchema);

export default Gist;
