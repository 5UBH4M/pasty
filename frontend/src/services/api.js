const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = {
    // Create a new gist
    createGist: async (gistData) => {
        const response = await fetch(`${API_BASE_URL}/gists`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(gistData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to create code share");
        }

        return result;
    },

    // Get a gist by ID
    getGist: async (id) => {
        const response = await fetch(`${API_BASE_URL}/gists/${id}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to fetch code snippet");
        }

        return result;
    },

    // Get all gists with pagination
    getAllGists: async (page = 1, limit = 20) => {
        const response = await fetch(`${API_BASE_URL}/gists?page=${page}&limit=${limit}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to fetch recent pastes");
        }

        return result;
    },

    // Search for a gist by ID
    searchGist: async (id) => {
        const response = await fetch(`${API_BASE_URL}/gists/search/${id}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to search for code snippet");
        }

        return result;
    },
};

export default api;
