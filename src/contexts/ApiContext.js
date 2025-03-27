// src/contexts/ApiContext.js
import React, { createContext, useContext } from 'react';

// API configuration that can be shared between apps
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://fotobox-api.slyrix.com';
export const API_ENDPOINT = `${API_BASE_URL}/api`;

// Create context for API access
const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
    // Simplified API methods needed for guest view
    const fetchPhoto = async (photoId) => {
        try {
            const response = await fetch(`${API_ENDPOINT}/photos/${photoId}`);

            if (!response.ok) {
                throw new Error(`Photo not found (Status: ${response.status})`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching photo:', error);
            throw error;
        }
    };

    // Get photo with different frame/overlay
    const getPhotoWithFrame = async (photoId, frameName) => {
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
                throw new Error(`Failed to apply frame (Status: ${response.status})`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error applying frame:', error);
            throw error;
        }
    };

    // Get list of available frames/overlays
    const getAvailableFrames = async () => {
        try {
            const response = await fetch(`${API_ENDPOINT}/admin/overlays`);

            if (!response.ok) {
                throw new Error(`Failed to fetch frames (Status: ${response.status})`);
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

    // Value object with all the API methods
    const value = {
        API_BASE_URL,
        API_ENDPOINT,
        fetchPhoto,
        getPhotoWithFrame,
        getAvailableFrames
    };

    return (
        <ApiContext.Provider value={value}>
            {children}
        </ApiContext.Provider>
    );
};

// Custom hook for accessing the API context
export const useApi = () => {
    const context = useContext(ApiContext);
    if (context === undefined) {
        throw new Error('useApi must be used within an ApiProvider');
    }
    return context;
};

export default ApiContext;