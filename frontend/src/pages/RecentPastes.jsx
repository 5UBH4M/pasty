import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Calendar, FileText, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

export default function RecentPastes() {
    const navigate = useNavigate();
    const [gists, setGists] = useState([]);
    const [searchId, setSearchId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadRecentGists();
    }, []);

    const loadRecentGists = async () => {
        try {
            setIsLoading(true);
            const result = await api.getAllGists();
            setGists(result.data || []);
        } catch (error) {
            console.error("Error loading gists:", error);
            toast.error("Failed to load recent pastes");
            setGists([]);
        } finally {
            setIsLoading(false);
        }
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const truncateCode = (code, maxLength = 100) => {
        return code.length > maxLength ? code.substring(0, maxLength) + "..." : code;
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                                Recent Pastes
                            </h1>
                            <p style={{ color: "var(--muted-foreground)" }}>Browse and search through recent code shares</p>
                        </div>
                        <button
                            onClick={() => navigate("/")}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
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
                                    placeholder="Enter 4-letter paste ID..."
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                                    onKeyPress={handleKeyPress}
                                    maxLength={4}
                                    className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-all uppercase"
                                    style={{
                                        backgroundColor: "var(--input-bg)",
                                        border: "1px solid var(--border-color)",
                                        color: "var(--foreground)",
                                    }}
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

                    {/* Recent Pastes List */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                                Loading recent pastes...
                            </div>
                        ) : gists.length === 0 ? (
                            <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                                No pastes found. Create your first paste!
                            </div>
                        ) : (
                            gists.map((gist) => (
                                <div
                                    key={gist.id}
                                    className="rounded-lg p-4 transition-colors cursor-pointer"
                                    style={{
                                        backgroundColor: "var(--card-bg)",
                                        border: "1px solid var(--border-color)",
                                        boxShadow: "var(--shadow)",
                                    }}
                                    onClick={() => navigate(`/code/${gist.id}`)}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = "var(--hover-bg)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = "var(--card-bg)";
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold truncate" style={{ color: "var(--foreground)" }}>
                                                    {gist.title || "Untitled"}
                                                </h3>
                                                <span
                                                    className="px-2 py-1 text-xs font-mono rounded"
                                                    style={{
                                                        backgroundColor: "var(--input-bg)",
                                                        color: "var(--primary-color)",
                                                        border: "1px solid var(--border-color)",
                                                    }}
                                                >
                                                    {gist.id}
                                                </span>
                                            </div>

                                            <div
                                                className="flex items-center gap-4 mb-3 text-sm"
                                                style={{ color: "var(--muted-foreground)" }}
                                            >
                                                {/* <div className="flex items-center gap-1">
                                                    <FileText className="w-4 h-4" />
                                                    {gist.fileName || "untitled.txt"}
                                                </div> */}
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(gist.createdAt)}
                                                </div>
                                            </div>

                                            <div
                                                className="text-sm font-mono p-3 rounded mb-3"
                                                style={{
                                                    backgroundColor: "var(--input-bg)",
                                                    border: "1px solid var(--border-color)",
                                                    color: "var(--muted-foreground)",
                                                }}
                                            >
                                                {truncateCode(gist.code)}
                                            </div>
                                        </div>

                                        <button
                                            className="flex-shrink-0 ml-4 p-2 rounded-md transition-colors"
                                            style={{
                                                backgroundColor: "var(--primary-color)",
                                                color: "var(--foreground)",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = "var(--primary-hover)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = "var(--primary-color)";
                                            }}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
