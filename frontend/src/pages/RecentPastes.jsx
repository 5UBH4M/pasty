import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

export default function RecentPastes() {
    const navigate = useNavigate();
    const [searchId, setSearchId] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Extract the 4-letter ID from a full URL or raw text
    const extractId = (value) => {
        const trimmed = value.trim();
        // Match /code/<id> at the end of a URL
        const urlMatch = trimmed.match(/\/code\/([a-zA-Z0-9]{4})\s*$/);
        if (urlMatch) {
            return urlMatch[1].toLowerCase();
        }
        // Otherwise take the first 4 alphanumeric chars (handles plain IDs)
        const clean = trimmed.replace(/[^a-zA-Z0-9]/g, "");
        return clean.slice(0, 4).toLowerCase();
    };

    const handleInputChange = (e) => {
        setSearchId(extractId(e.target.value));
    };

    const handleSearch = async () => {
        if (!searchId.trim()) {
            toast.error("Please enter a 4-letter ID to search");
            return;
        }

        if (searchId.length !== 4) {
            toast.error("ID must be exactly 4 characters long");
            return;
        }

        try {
            setIsSearching(true);
            const result = await api.searchGist(searchId);
            if (result.data) {
                navigate(`/code/${result.data.id}`);
            } else {
                toast.error("No paste found with that ID");
            }
        } catch (error) {
            console.error("Error searching gist:", error);
            toast.error("Paste not found or error occurred");
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
            <div className="w-full max-w-4xl px-4 py-8">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                                Search Paste
                            </h1>
                            <p style={{ color: "var(--muted-foreground)" }}>Enter a 4-letter ID to find a code snippet</p>
                        </div>
                        <button
                            onClick={() => navigate("/")}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium"
                            style={{
                                backgroundColor: "var(--secondary-color)",
                                color: "var(--foreground)",
                                border: "1px solid var(--border-color)",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "var(--secondary-hover)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "var(--secondary-color)";
                            }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Create New
                        </button>
                    </div>

                    {/* Search Section */}
                    <div
                        className="rounded-lg p-6"
                        style={{
                            backgroundColor: "var(--card-bg)",
                            border: "1px solid var(--border-color)",
                            boxShadow: "var(--shadow)",
                        }}
                    >
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Enter 4-letter paste ID or paste a link..."
                                    value={searchId}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyPress}
                                    className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-all"
                                    style={{
                                        backgroundColor: "var(--input-bg)",
                                        border: "1px solid var(--border-color)",
                                        color: "var(--foreground)",
                                    }}
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2"
                                style={{
                                    backgroundColor: isSearching ? "var(--muted)" : "var(--primary-color)",
                                    color: "var(--foreground)",
                                    cursor: isSearching ? "not-allowed" : "pointer",
                                    minWidth: "100px",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSearching) {
                                        e.target.style.backgroundColor = "var(--primary-hover)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSearching) {
                                        e.target.style.backgroundColor = "var(--primary-color)";
                                    }
                                }}
                            >
                                <Search className="w-4 h-4" />
                                {isSearching ? "Searching..." : "Search"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
