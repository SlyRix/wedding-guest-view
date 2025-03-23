// src/components/PhotoFilters.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../contexts/ApiContext';

const PhotoFilters = ({ photoId, selectedFilter, onFilterSelect }) => {
    const { API_BASE_URL, applyFilter } = useApi();
    const [applying, setApplying] = useState(false);
    const [message, setMessage] = useState(null);

    // Filter definitions
    const filters = [
        { id: 'original', name: 'Original' },
        { id: 'grayscale', name: 'B&W' },
        { id: 'sepia', name: 'Vintage' },
        { id: 'dream', name: 'Dream' },
        { id: 'romance', name: 'Romance' },
        { id: 'forever', name: 'Forever' }
    ];

    // Get CSS style for a filter preview
    const getFilterStyle = (filterId) => {
        switch (filterId) {
            case 'grayscale':
                return { filter: 'grayscale(1)' };
            case 'sepia':
                return { filter: 'sepia(0.7) contrast(1.05)' };
            case 'dream':
                return { filter: 'brightness(1.1) contrast(0.85) saturate(1.2) blur(0.5px)' };
            case 'romance':
                return { filter: 'brightness(1.05) contrast(0.95) saturate(1.15) sepia(0.2) hue-rotate(330deg)' };
            case 'forever':
                return {
                    filter: 'contrast(1.15) brightness(1.1) saturate(1.05)',
                    boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)'
                };
            case 'original':
            default:
                return {};
        }
    };

    // Handle saving a photo with the selected filter
    const handleApplyFilter = async () => {
        if (selectedFilter === 'original' || applying) return;

        try {
            setApplying(true);
            setMessage(null);

            const result = await applyFilter(photoId, selectedFilter);

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: 'Filter applied successfully! You can now download the filtered photo.'
                });

                // Update the page URL to point to the filtered version
                if (result.photoUrl) {
                    window.history.pushState(
                        {},
                        '',
                        `/photo/${result.photoUrl.split('/').pop()}`
                    );
                }
            } else {
                setMessage({
                    type: 'error',
                    text: result.error || 'Failed to apply filter'
                });
            }
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.message || 'Error applying filter'
            });
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Photo Filters</h3>

                {selectedFilter !== 'original' && (
                    <button
                        onClick={handleApplyFilter}
                        disabled={applying}
                        className={`bg-christian-accent text-white px-4 py-1.5 rounded-md text-sm font-medium ${
                            applying ? 'opacity-70 cursor-not-allowed' : 'hover:bg-christian-accent/90'
                        }`}
                    >
                        {applying ? 'Applying...' : 'Save with Filter'}
                    </button>
                )}
            </div>

            {/* Filter message */}
            {message && (
                <div className={`mb-4 p-3 rounded-md text-sm ${
                    message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Filter options */}
            <div className="flex space-x-3 overflow-x-auto pb-2">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => onFilterSelect(filter.id)}
                        className={`flex flex-col items-center p-2 rounded-md transition-all ${
                            selectedFilter === filter.id
                                ? 'bg-wedding-love/10 ring-2 ring-wedding-love shadow-md'
                                : 'bg-white hover:bg-gray-50'
                        }`}
                    >
                        <div
                            className="w-16 h-16 rounded-md overflow-hidden mb-2 bg-gray-100 shadow-sm"
                            style={getFilterStyle(filter.id)}
                        >
                            <img
                                src={`${API_BASE_URL}/photos/filter-preview.jpg`}
                                alt={filter.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/150';
                                }}
                            />
                        </div>
                        <span className={`text-xs font-medium ${
                            selectedFilter === filter.id ? 'text-wedding-love' : 'text-gray-700'
                        }`}>
              {filter.name}
            </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PhotoFilters;
