import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {useApi} from '../contexts/ApiContext';
import {shareNative, isNativeShareAvailable, copyToClipboard, SHARE_PLATFORMS} from '../utils/shareUtils';

const PhotoView = () => {
    const {photoId} = useParams();
    const navigate = useNavigate();
    const {API_BASE_URL, fetchPhoto, applyFilter, getPhotoWithFrame, getAvailableFrames} = useApi();

    // Main state
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const [isMobile, setIsMobile] = useState(false);
    const [originalPhotoId, setOriginalPhotoId] = useState(null); // Store the original photo ID

    // UI state
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showFrameOptions, setShowFrameOptions] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('original');
    const [shareSuccess, setShareSuccess] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [availableFrames, setAvailableFrames] = useState([]);
    const [isApplyingFilter, setIsApplyingFilter] = useState(false);
    const [isChangingFrame, setIsChangingFrame] = useState(false);
    const [sharing, setSharing] = useState(false);

    // Store filter previews
    const [filterPreviews, setFilterPreviews] = useState({
        original: { style: {} },
        grayscale: { style: {filter: 'grayscale(1)'} },
        sepia: { style: {filter: 'sepia(0.7) contrast(1.05)'} },
        dream: { style: {filter: 'brightness(1.1) contrast(0.85) saturate(1.2) blur(0.5px)'} },
        romance: { style: {filter: 'brightness(1.05) contrast(0.95) saturate(1.15) sepia(0.2) hue-rotate(330deg)'} },
        forever: { style: {
                filter: 'contrast(1.15) brightness(1.1) saturate(1.05)',
                boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)'
            }}
    });

    // Zoom functionality
    const [scale, setScale] = useState(1);
    const [lastTapTime, setLastTapTime] = useState(0);
    const photoRef = useRef(null);

    // Detect device and orientation
    useEffect(() => {
        const handleResize = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
            const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
            setIsMobile(mobileCheck);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        // Initial check
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    // Fetch photo data when component mounts or photoId changes
    useEffect(() => {
        const getPhotoData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch photo details
                const data = await fetchPhoto(photoId);

                if (data.success) {
                    setPhoto(data);

                    // Store the original photo ID (without filter prefixes)
                    // This helps preserve the frame when applying filters
                    const baseId = photoId.replace(/^filtered_[^_]+_/, '');
                    setOriginalPhotoId(baseId);

                    // Fetch available frames
                    const frames = await getAvailableFrames();
                    setAvailableFrames(frames);
                } else {
                    setError(data.error || 'Photo not found');
                }
            } catch (err) {
                console.error('Error loading photo:', err);
                setError(err.message || 'Failed to load photo');
            } finally {
                setLoading(false);
            }
        };

        if (photoId) {
            getPhotoData();
        } else {
            setError('No photo ID provided');
            setLoading(false);
        }
    }, [photoId, fetchPhoto, getAvailableFrames]);

    // Handle double-tap zoom
    useEffect(() => {
        const handleDoubleTap = (e) => {
            if (!isMobile) return;

            const now = Date.now();
            if (now - lastTapTime < 300) { // 300ms threshold for double-tap
                e.preventDefault();
                // Toggle zoom on double tap
                setScale(scale === 1 ? 2 : 1);
            }
            setLastTapTime(now);
        };

        const element = photoRef.current;
        if (element) {
            element.addEventListener('touchend', handleDoubleTap);

            return () => {
                element.removeEventListener('touchend', handleDoubleTap);
            };
        }
    }, [isMobile, lastTapTime, scale]);

    // Reset success indicators after 3 seconds
    useEffect(() => {
        if (shareSuccess) {
            const timer = setTimeout(() => setShareSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [shareSuccess]);

    useEffect(() => {
        if (downloadSuccess) {
            const timer = setTimeout(() => setDownloadSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [downloadSuccess]);

    // Handle share functionality
    const handleShareImage = async () => {
        if (!photo || !photo.filename) {
            alert('No photo available to share.');
            return;
        }

        try {
            setSharing(true);
            console.log('Attempting to share...');

            const response = await fetch(`${API_BASE_URL}${photo.url}`);
            const blob = await response.blob();
            const file = new File([blob], photo.filename || 'photo.jpg', { type: blob.type });

            if (navigator.share) {
                console.log('Using Web Share API');
                await navigator.share({
                    title: 'Wedding Photo',
                    text: 'Check out this wedding photo! 💕',
                    files: [file],
                });
                console.log('Share successful');
                setShareSuccess(true);
            } else {
                console.log('Web Share API not supported. Using fallback.');
                await copyToClipboard(window.location.href);
                alert('Link copied to clipboard! Share it manually.');
                setShowShareOptions(true);
            }
        } catch (error) {
            console.error('Error sharing:', error);
            alert(`Sharing failed: ${error.message || 'Unknown error'}`);
        } finally {
            setSharing(false);
        }
    };

    // Handle download with success indicator
    const handleDownload = async () => {
        if (!photo || !photo.filename) return;

        try {
            // Fetch the image file from the server
            const imageUrl = `${API_BASE_URL}${photo.url}`;
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error("Failed to fetch image for download.");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Create a temporary download link
            const link = document.createElement('a');
            link.href = url;
            link.download = photo.filename || "wedding-photo.jpg";
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setDownloadSuccess(true);
        } catch (error) {
            console.error('Download failed:', error);
            alert("Download failed. Try again or save manually.");
        }
    };

    // Apply a filter to the photo
    const handleApplyFilter = async () => {
        if (selectedFilter === 'original' || isApplyingFilter || !photo) return;

        try {
            setIsApplyingFilter(true);

            // Important: Use originalPhotoId to ensure we keep the frame when applying filters
            const photoToFilter = originalPhotoId || photoId;

            // Use the API to apply the filter
            const result = await applyFilter(photoToFilter, selectedFilter);

            if (result.success) {
                // Update the URL to the filtered version
                if (result.photoUrl) {
                    const filteredPhotoId = result.photoUrl.split('/').pop();
                    navigate(`/photo/${filteredPhotoId}`, {replace: true});

                    // Reload the photo data with the new filtered version
                    const newPhotoData = await fetchPhoto(filteredPhotoId);
                    if (newPhotoData.success) {
                        setPhoto(newPhotoData);
                        // We keep the selectedFilter as is (don't reset to original)
                        // Close filter panel
                        setShowFilters(false);
                    }
                }
            } else {
                alert(result.error || 'Failed to apply filter');
            }
        } catch (error) {
            console.error('Error applying filter:', error);
            alert('Failed to apply filter. Please try again.');
        } finally {
            setIsApplyingFilter(false);
        }
    };

    // Change the photo frame/overlay
    const handleChangeFrame = async (frameName) => {
        if (!photo || isChangingFrame) return;

        try {
            setIsChangingFrame(true);

            // If we have an original photo ID, use that to ensure we're applying 
            // the frame to the base photo without filters
            const photoToFrame = originalPhotoId || photoId;

            // Use the API to change the frame
            const result = await getPhotoWithFrame(photoToFrame, frameName);

            if (result.success) {
                // Navigate to the new framed version
                if (result.photoId) {
                    navigate(`/photo/${result.photoId}`, {replace: true});

                    // Reload the photo data with the new frame
                    const newPhotoData = await fetchPhoto(result.photoId);
                    if (newPhotoData.success) {
                        setPhoto(newPhotoData);

                        // Update original photo ID
                        setOriginalPhotoId(result.photoId);

                        // Reset filter to original when changing frames
                        setSelectedFilter('original');

                        // Close frame options panel
                        setShowFrameOptions(false);
                    }
                }
            } else {
                alert(result.error || 'Failed to change frame');
            }
        } catch (error) {
            console.error('Error changing frame:', error);
            alert('Failed to change frame. Please try again.');
        } finally {
            setIsChangingFrame(false);
        }
    };

    // Copy photo link to clipboard
    const handleCopyLink = async () => {
        const success = await copyToClipboard(window.location.href);
        if (success) {
            alert('Link copied to clipboard!');
        } else {
            alert('Failed to copy link. Please try again.');
        }
    };

    // Format date for display
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    // Show loading state
    if (loading) {
        return (<div
            className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-christian-accent/10 to-hindu-secondary/10">
            <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center justify-center">
                <div
                    className="w-16 h-16 border-4 border-t-wedding-love border-gray-200 rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-display">Loading your photo...</h2>
            </div>
        </div>);
    }

    // Show error state
    if (error || !photo) {
        return (<div
            className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-christian-accent/10 to-hindu-secondary/10">
            <div className="bg-white p-8 rounded-xl shadow-xl max-w-md text-center">
                <div className="text-5xl text-wedding-love mb-4">😕</div>
                <h2 className="text-2xl font-bold mb-2">Photo Not Found</h2>
                <p className="text-gray-700 mb-6">{error || "We couldn't find the requested photo."}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-christian-accent text-white px-6 py-2 rounded-full hover:bg-christian-accent/90 transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>);
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-christian-accent/10 to-hindu-secondary/10">
            {/* Mobile-friendly header */}
            <div
                className="bg-gradient-to-r from-hindu-secondary to-hindu-accent text-white p-3 flex items-center justify-between shadow-md">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                    </svg>
                </button>

                <h2 className="text-xl font-script">Rushel & Sivani</h2>

                <div className="w-8"></div>
                {/* Spacer to balance layout */}
            </div>

            <div className="flex-1 p-3 sm:p-4 overflow-auto">
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.5}}
                    className="bg-white rounded-xl shadow-elegant overflow-hidden mx-auto"
                    style={{maxWidth: isMobile ? '100%' : '800px'}}
                >
                    {/* Photo display - enables double tap zoom for mobile */}
                    <div
                        ref={photoRef}
                        className="relative overflow-hidden"
                        style={{touchAction: "manipulation"}}
                        onDoubleClick={() => setScale(scale === 1 ? 2 : 1)}
                    >
                        <motion.div
                            animate={{scale}}
                            transition={{type: "spring", damping: 20}}
                            className="flex items-center justify-center"
                        >
                            {/* Apply selected filter visually to preview if not yet applied on server */}
                            <div style={
                                selectedFilter !== 'original' && !photoId.includes(`filtered_${selectedFilter}_`)
                                    ? filterPreviews[selectedFilter]?.style || {}
                                    : {}
                            }>
                                <img
                                    src={`${API_BASE_URL}${photo.url}`}
                                    alt="Wedding photo"
                                    className="w-full h-auto"
                                />
                            </div>
                        </motion.div>

                        {/* Mobile instruction overlay - briefly shown */}
                        {isMobile && (<motion.div
                            initial={{opacity: 1}}
                            animate={{opacity: 0}}
                            transition={{delay: 2, duration: 1}}
                            className="absolute bottom-4 left-0 right-0 text-center text-white text-sm pointer-events-none"
                        >
                            <div className="bg-black/40 mx-auto inline-block px-3 py-1 rounded-full">
                                Double-tap to zoom
                            </div>
                        </motion.div>)}
                    </div>

                    {/* Date and event info */}
                    <div className="px-4 pt-3 text-center">
                        <p className="text-sm text-gray-500">
                            {formatDate(photo.timestamp)}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="p-4 grid grid-cols-3 gap-3">
                        <motion.button
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            onClick={() => {
                                setShowFilters(!showFilters);
                                setShowShareOptions(false);
                                setShowFrameOptions(false);
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${showFilters ? 'bg-wedding-love/10 text-wedding-love' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                            </svg>
                            <span className="text-sm font-medium">Filters</span>
                        </motion.button>

                        <motion.button
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            onClick={() => {
                                setShowFrameOptions(!showFrameOptions);
                                setShowFilters(false);
                                setShowShareOptions(false);
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${showFrameOptions ? 'bg-wedding-love/10 text-wedding-love' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <span className="text-sm font-medium">Frames</span>
                        </motion.button>
                        <motion.button
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                            onClick={() => {
                                setShowFrameOptions(false);
                                setShowFilters(false);
                                setShowShareOptions(handleShareImage);
                            }}
                            disabled={sharing}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${showShareOptions ? 'bg-wedding-love/10 text-wedding-love' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            <AnimatePresence mode="wait">
                                {shareSuccess ? (<motion.div
                                    key="success"
                                    initial={{scale: 0.5, opacity: 0}}
                                    animate={{scale: 1, opacity: 1}}
                                    exit={{scale: 0.5, opacity: 0}}
                                    className="mr-2 text-white"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M5 13l4 4L19 7"/>
                                    </svg>
                                </motion.div>) : sharing ? (<motion.div
                                    key="sharing"
                                    initial={{scale: 0.5, opacity: 0}}
                                    animate={{scale: 1, opacity: 1}}
                                    exit={{scale: 0.5, opacity: 0}}
                                    className="mr-2"
                                >
                                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg"
                                         fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </motion.div>) : (<motion.div
                                    key="share"
                                    initial={{scale: 0.5, opacity: 0}}
                                    animate={{scale: 1, opacity: 1}}
                                    exit={{scale: 0.5, opacity: 0}}
                                    className="mr-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                                    </svg>
                                </motion.div>)}
                            </AnimatePresence>
                            <span>
                             {shareSuccess ? "Shared!" : (sharing ? "Sharing..." : "Share Photo")}
                            </span>
                        </motion.button>

                    </div>

                    {/* Download button (always visible) */}
                    <div className="px-4 pb-4">
                        <motion.button
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                            onClick={handleDownload}
                            className="w-full bg-christian-accent text-white py-3 rounded-lg font-medium flex items-center justify-center"
                        >
                            <AnimatePresence mode="wait">
                                {downloadSuccess ? (<motion.div
                                    key="success"
                                    initial={{scale: 0.5, opacity: 0}}
                                    animate={{scale: 1, opacity: 1}}
                                    exit={{scale: 0.5, opacity: 0}}
                                    className="mr-2 text-white"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M5 13l4 4L19 7"/>
                                    </svg>
                                </motion.div>) : (<motion.div
                                    key="download"
                                    initial={{scale: 0.5, opacity: 0}}
                                    animate={{scale: 1, opacity: 1}}
                                    exit={{scale: 0.5, opacity: 0}}
                                    className="mr-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                    </svg>
                                </motion.div>)}
                            </AnimatePresence>
                            {downloadSuccess ? "Downloaded!" : "Download Photo"}
                        </motion.button>
                    </div>

                    {/* Filter panel */}
                    <AnimatePresence>
                        {showFilters && (<motion.div
                            initial={{height: 0, opacity: 0}}
                            animate={{height: 'auto', opacity: 1}}
                            exit={{height: 0, opacity: 0}}
                            className="overflow-hidden border-t border-gray-200"
                        >
                            <div className="p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium">Photo Filters</h3>

                                    {selectedFilter !== 'original' && (<button
                                        onClick={handleApplyFilter}
                                        disabled={isApplyingFilter}
                                        className={`px-3 py-1 bg-wedding-love text-white text-sm rounded-full ${isApplyingFilter ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isApplyingFilter ? (<div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                 xmlns="http://www.w3.org/2000/svg" fill="none"
                                                 viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10"
                                                        stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor"
                                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Applying...
                                        </div>) : "Apply Filter"}
                                    </button>)}
                                </div>

                                <div className="flex space-x-3 overflow-x-auto py-2">
                                    {Object.entries(filterPreviews).map(([filterId, filter]) => {
                                        const filterName =
                                            filterId === 'original' ? 'Original' :
                                                filterId === 'grayscale' ? 'B&W' :
                                                    filterId === 'sepia' ? 'Vintage' :
                                                        filterId === 'dream' ? 'Dream' :
                                                            filterId === 'romance' ? 'Romance' :
                                                                filterId === 'forever' ? 'Forever' :
                                                                    filterId;

                                        return (
                                            <button
                                                key={filterId}
                                                onClick={() => setSelectedFilter(filterId)}
                                                className={`flex flex-col items-center ${selectedFilter === filterId ? 'bg-wedding-love/10 ring-2 ring-wedding-love' : 'bg-white hover:bg-gray-100'} p-2 rounded-lg transition-colors`}
                                            >
                                                <div
                                                    className="w-16 h-16 rounded-lg overflow-hidden mb-2"
                                                    style={filter.style}
                                                >
                                                    <img
                                                        src={`${API_BASE_URL}${photo.thumbnailUrl || photo.url}`}
                                                        alt={filterName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">{filterName}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>)}
                    </AnimatePresence>

                    {/* Frame options panel */}
                    <AnimatePresence>
                        {showFrameOptions && (<motion.div
                            initial={{height: 0, opacity: 0}}
                            animate={{height: 'auto', opacity: 1}}
                            exit={{height: 0, opacity: 0}}
                            className="overflow-hidden border-t border-gray-200"
                        >
                            <div className="p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium">Photo Frames</h3>

                                    {isChangingFrame && (<div className="text-sm text-gray-500 flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
                                             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10"
                                                    stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor"
                                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Changing...
                                    </div>)}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {/* Standard frame */}
                                    <button
                                        onClick={() => handleChangeFrame('wedding-frame.png')}
                                        disabled={isChangingFrame}
                                        className={`p-3 border rounded-lg flex flex-col items-center ${!photo.isInstagram && !photo.isCustomFrame ? 'bg-wedding-love/10 border-wedding-love' : 'bg-white hover:bg-gray-100 border-gray-200'} ${isChangingFrame ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="w-16 h-16 flex items-center justify-center mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                 className="h-8 w-8 text-christian-accent" fill="none"
                                                 viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium">Standard</span>
                                        <span className="text-xs text-gray-500">A5 Landscape</span>
                                    </button>

                                    {/* Instagram frame */}
                                    <button
                                        onClick={() => handleChangeFrame('instagram-frame.png')}
                                        disabled={isChangingFrame}
                                        className={`p-3 border rounded-lg flex flex-col items-center ${photo.isInstagram ? 'bg-wedding-love/10 border-wedding-love' : 'bg-white hover:bg-gray-100 border-gray-200'} ${isChangingFrame ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="w-16 h-16 flex items-center justify-center mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                 className="h-8 w-8 text-pink-500" viewBox="0 0 24 24"
                                                 fill="currentColor">
                                                <path fillRule="evenodd"
                                                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                                                      clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium">Instagram</span>
                                        <span className="text-xs text-gray-500">9:16 Portrait</span>
                                    </button>

                                    {/* Custom frames */}
                                    {availableFrames.map((frame) => (<button
                                        key={frame.name}
                                        onClick={() => handleChangeFrame(frame.name)}
                                        disabled={isChangingFrame}
                                        className={`p-3 border rounded-lg flex flex-col items-center ${photo.isCustomFrame && photo.customFrameName === frame.name ? 'bg-wedding-love/10 border-wedding-love' : 'bg-white hover:bg-gray-100 border-gray-200'} ${isChangingFrame ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div
                                            className="w-16 h-16 flex items-center justify-center mb-2 overflow-hidden">
                                            <img
                                                src={`${API_BASE_URL}${frame.url}`}
                                                alt={frame.name}
                                                className="max-w-full max-h-full object-contain"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium truncate max-w-full">
                                                    {frame.name.split('.')[0].replace(/[_-]/g, ' ')}
                                                </span>
                                        <span className="text-xs text-gray-500">Custom Frame</span>
                                    </button>))}
                                </div>
                            </div>
                        </motion.div>)}
                    </AnimatePresence>
                </motion.div>

                {/* Footer text */}
                <div className="text-center mt-6 text-gray-500 text-sm">
                    <p>Thank you for celebrating with us!</p>
                    <p className="mt-1">
                        <span className="text-wedding-love">#RushelAndSivani</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PhotoView;