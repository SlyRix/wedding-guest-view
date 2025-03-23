// src/components/ShareOptions.js
import React, { useState } from 'react';

const ShareOptions = ({ photoUrl }) => {
    const [copied, setCopied] = useState(false);

    const shareOptions = [
        {
            name: 'WhatsApp',
            url: `https://wa.me/?text=${encodeURIComponent(`Check out this photo from Rushel & Sivani's wedding! ${photoUrl}`)}`,
            color: '#25D366'
        },
        {
            name: 'Facebook',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(photoUrl)}`,
            color: '#1877F2'
        },
        {
            name: 'Twitter',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this photo from Rushel & Sivani's wedding! ${photoUrl}`)}`,
            color: '#1DA1F2'
        },
        {
            name: 'Email',
            url: `mailto:?subject=Wedding Photo&body=${encodeURIComponent(`Check out this photo from Rushel & Sivani's wedding!\n\n${photoUrl}`)}`,
            color: '#D44638'
        }
    ];

    // Copy link to clipboard
    const copyToClipboard = () => {
        navigator.clipboard.writeText(photoUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Try native sharing if available (mobile devices)
    const useNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Wedding Photo',
                    text: 'Check out this photo from Rushel & Sivani\'s wedding!',
                    url: photoUrl
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        }
    };

    return (
        <div className="p-4 bg-gray-50">
            <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Share this photo</h3>

                {/* Native share button for mobile */}
                {navigator.share && (
                    <button
                        onClick={useNativeShare}
                        className="w-full bg-hindu-accent text-white py-3 rounded-md mb-4 font-medium"
                    >
                        Share using your device
                    </button>
                )}

                {/* Shareable link */}
                <div className="flex mb-4">
                    <input
                        type="text"
                        value={photoUrl}
                        readOnly
                        className="flex-1 p-2 border border-gray-300 rounded-l-md text-sm"
                        onClick={(e) => e.target.select()}
                    />
                    <button
                        onClick={copyToClipboard}
                        className="bg-gray-200 px-4 rounded-r-md font-medium hover:bg-gray-300 transition-colors"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>

            {/* Social sharing buttons */}
            <div className="grid grid-cols-2 gap-2">
                {shareOptions.map((option) => (
                    <a
                        key={option.name}
                        href={option.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center py-3 rounded-md text-white font-medium"
                        style={{ backgroundColor: option.color }}
                    >
                        {option.name}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default ShareOptions;
