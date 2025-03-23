// src/components/DownloadButton.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { downloadPhoto } from '../utils/api';

/**
 * Reusable download button component with success animation
 */
const DownloadButton = ({
                            url,
                            filename = 'wedding-photo.jpg',
                            className = '',
                            variant = 'primary',
                            fullWidth = false,
                            icon = null,
                            children = 'Download'
                        }) => {
    const [downloading, setDownloading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Button variants styling
    const variants = {
        primary: 'bg-christian-accent text-white hover:bg-christian-accent/90',
        secondary: 'bg-hindu-accent text-white hover:bg-hindu-accent/90',
        outline: 'bg-transparent border-2 border-christian-accent text-christian-accent hover:bg-christian-accent/10'
    };

    // Base button classes
    const baseClasses = `
    flex items-center justify-center px-4 py-2 rounded-full 
    font-medium transition-all duration-300 shadow-sm
    ${fullWidth ? 'w-full' : ''}
    ${variants[variant] || variants.primary}
    ${className}
  `.trim();

    const handleDownload = async () => {
        if (downloading) return;

        setDownloading(true);
        try {
            // Use the downloadPhoto utility
            await downloadPhoto(url, filename);

            // Show success state briefly
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download photo. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <motion.button
            onClick={handleDownload}
            disabled={downloading}
            className={baseClasses}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
        >
            {/* Success checkmark animation */}
            <AnimatedIcon success={success} downloading={downloading} icon={icon} />
            <span>{success ? 'Downloaded!' : (downloading ? 'Downloading...' : children)}</span>
        </motion.button>
    );
};

// Animated icon component
const AnimatedIcon = ({ success, downloading, icon }) => {
    // If no icon is provided and not in a special state, return null
    if (!icon && !success && !downloading) return null;

    return (
        <motion.div
            className="mr-2 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
                opacity: 1,
                scale: success ? [1, 1.2, 1] : 1,
                rotate: downloading ? 360 : 0
            }}
            transition={downloading ?
                { rotate: { repeat: Infinity, duration: 1.5, ease: "linear" } } :
                { duration: 0.3 }
            }
        >
            {success ? (
                // Success checkmark
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
            ) : downloading ? (
                // Loading spinner
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
            ) : (
                // Custom icon
                icon
            )}
        </motion.div>
    );
};

export default DownloadButton;