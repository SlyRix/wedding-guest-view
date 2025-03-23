// src/utils/api.js
// Utility functions for API interactions

// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://fotobox-api.slyrix.com';
export const API_ENDPOINT = `${API_BASE_URL}/api`;

/**
 * Fetches a photo by its ID
 * @param {string} photoId - ID of the photo to fetch
 * @returns {Promise<Object>} - Photo data
 */
export const fetchPhoto = async (photoId) => {
    try {
        const response = await fetch(`${API_ENDPOINT}/photos/${photoId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch photo (${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching photo:', error);
        throw error;
    }
};

/**
 * Applies a filter to a photo
 * @param {string} photoId - ID of the photo
 * @param {string} filter - Filter to apply (grayscale, sepia, etc.)
 * @returns {Promise<Object>} - Result of the operation
 */
export const applyFilter = async (photoId, filter) => {
    try {
        const response = await fetch(`${API_ENDPOINT}/photos/${photoId}/filter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filter })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to apply filter (${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error applying filter:', error);
        throw error;
    }
};

/**
 * Gets a photo with a different frame/overlay
 * @param {string} photoId - ID of the photo
 * @param {string} frameName - Name of the frame to apply
 * @returns {Promise<Object>} - Result of the operation
 */
export const getPhotoWithFrame = async (photoId, frameName) => {
    try {
        const response = await fetch(`${API_ENDPOINT}/photos/${photoId}/overlay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                overlayName: frameName,
                createNewVersion: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to apply frame (${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error applying frame:', error);
        throw error;
    }
};

/**
 * Gets a list of available frames/overlays
 * @returns {Promise<Array>} - List of available frames
 */
export const getAvailableFrames = async () => {
    try {
        const response = await fetch(`${API_ENDPOINT}/admin/overlays`);

        if (!response.ok) {
            return [];
        }

        const overlays = await response.json();

        // Filter out standard and Instagram frames for simplicity
        return overlays.filter(overlay =>
            overlay.name !== 'wedding-frame.png' &&
            !overlay.name.startsWith('instagram')
        );
    } catch (error) {
        console.error('Error fetching frames:', error);
        return [];
    }
};

/**
 * Downloads a photo
 * @param {string} url - URL of the photo
 * @param {string} filename - Filename for download
 */
export const downloadPhoto = (url, filename = 'wedding-photo.jpg') => {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    document.body.removeChild(link);
};

// Error handling helper
export const handleApiError = (error) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return error.response.data.error || `Error: ${error.response.status}`;
    } else if (error.request) {
        // The request was made but no response was received
        return 'No response from server. Please check your connection.';
    } else {
        // Something happened in setting up the request that triggered an Error
        return error.message || 'An unknown error occurred';
    }
};