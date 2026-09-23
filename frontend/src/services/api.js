const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = {
    // Create a new gist (supports screenshots + files via FormData)
    createGist: async (gistData, screenshots = [], files = []) => {
        const formData = new FormData();
        formData.append("code", gistData.code || "");
        formData.append("title", gistData.title || "Untitled");
        formData.append("ttlHours", gistData.ttlHours || 168);

        for (const file of screenshots) {
            formData.append("screenshots", file);
        }
        for (const file of files) {
            formData.append("files", file);
        }

        const response = await fetch(`${API_BASE_URL}/gists`, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to create code share");
        }

        return result;
    },

    getGist: async (id) => {
        const response = await fetch(`${API_BASE_URL}/gists/${id}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to fetch code snippet");
        }

        return result;
    },

    getScreenshotUrl: (gistId, index) => {
        return `${API_BASE_URL}/gists/${gistId}/screenshots/${index}`;
    },

    getFileUrl: (gistId, index) => {
        return `${API_BASE_URL}/gists/${gistId}/files/${index}`;
    },

    getAllGists: async (page = 1, limit = 20) => {
        const response = await fetch(`${API_BASE_URL}/gists?page=${page}&limit=${limit}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to fetch recent pastes");
        }

        return result;
    },

    searchGist: async (id) => {
        const response = await fetch(`${API_BASE_URL}/gists/search/${id}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to search for code snippet");
        }

        return result;
    },

    // ——— Room APIs ———

    createRoom: async (roomData) => {
        const response = await fetch(`${API_BASE_URL}/rooms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(roomData),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to create room");
        return result;
    },

    getRoom: async (code) => {
        const response = await fetch(`${API_BASE_URL}/rooms/${code}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to fetch room");
        return result;
    },

    addRoomEntry: async (code, entryData, screenshots = [], files = []) => {
        const formData = new FormData();
        formData.append("code", entryData.code || "");
        formData.append("title", entryData.title || "Untitled");

        for (const file of screenshots) formData.append("screenshots", file);
        for (const file of files) formData.append("files", file);

        const response = await fetch(`${API_BASE_URL}/rooms/${code}/entries`, {
            method: "POST",
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to add entry");
        return result;
    },

    getRoomScreenshotUrl: (code, entryId, index) => {
        return `${API_BASE_URL}/rooms/${code}/entries/${entryId}/screenshots/${index}`;
    },

    getRoomFileUrl: (code, entryId, index) => {
        return `${API_BASE_URL}/rooms/${code}/entries/${entryId}/files/${index}`;
    },
};

export default api;
