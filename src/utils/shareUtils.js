// src/utils/shareUtils.js
// Utility functions for social sharing

/**
 * Default share message template
 */
const DEFAULT_SHARE_MESSAGE = "Check out this photo from Rushel & Sivani's wedding!";

/**
 * List of social sharing platforms with their URLs and colors
 */
export const SHARE_PLATFORMS = [
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        getUrl: (url, message = DEFAULT_SHARE_MESSAGE) =>
            `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`,
        color: '#25D366',
        icon: 'whatsapp'
    },
    {
        id: 'facebook',
        name: 'Facebook',
        getUrl: (url, message = DEFAULT_SHARE_MESSAGE) =>
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        color: '#1877F2',
        icon: 'facebook'
    },
    {
        id: 'twitter',
        name: 'Twitter',
        getUrl: (url, message = DEFAULT_SHARE_MESSAGE) =>
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${message} ${url}`)}`,
        color: '#1DA1F2',
        icon: 'twitter'
    },
    {
        id: 'email',
        name: 'Email',
        getUrl: (url, message = DEFAULT_SHARE_MESSAGE) =>
            `mailto:?subject=Wedding Photo&body=${encodeURIComponent(`${message}\n\n${url}`)}`,
        color: '#D44638',
        icon: 'email'
    }
];

/**
 * Checks if Web Share API is available
 * @returns {boolean} - Whether the Web Share API is available
 */
export const isNativeShareAvailable = () => {
    return navigator.share !== undefined;
};

/**
 * Shares content using the Web Share API (for mobile devices)
 * @param {Object} options - Share options
 * @param {string} options.url - URL to share
 * @param {string} options.title - Title for the share
 * @param {string} options.text - Text description for the share
 * @returns {Promise<void>} - Promise that resolves when sharing is complete
 */
export const shareNative = async ({ url, title = 'Wedding Photo', text = DEFAULT_SHARE_MESSAGE }) => {
    if (!isNativeShareAvailable()) {
        throw new Error('Native sharing not available');
    }

    try {
        await navigator.share({
            title,
            text,
            url
        });
        return true;
    } catch (error) {
        console.error('Error sharing content:', error);
        // The user might have cancelled sharing, which also throws an error
        if (error.name !== 'AbortError') {
            throw error;
        }
        return false;
    }
};

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Whether copying was successful
 */
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);

        // Fallback for browsers that don't support clipboard API
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";  // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (fallbackError) {
            console.error('Fallback clipboard copy failed:', fallbackError);
            return false;
        }
    }
};

/**
 * Opens a share URL in a popup window
 * @param {string} url - URL to open
 * @param {string} title - Title for the popup window
 */
export const openSharePopup = (url, title = 'Share') => {
    // Calculate the center position for the popup
    const width = 550;
    const height = 450;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    // Open popup with specific dimensions
    window.open(
        url,
        title,
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=${width}, height=${height}, top=${top}, left=${left}`
    );
};