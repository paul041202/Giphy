import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [gifs, setGifs] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Start with empty search
  const [inputValue, setInputValue] = useState(''); // Separate input state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedGif, setSelectedGif] = useState(null); // For modal
  const [darkMode, setDarkMode] = useState(false); // For dark mode toggle
  const [showModal, setShowModal] = useState(false); // For modal visibility
  const [offset, setOffset] = useState(0); // For pagination
  const [hasMore, setHasMore] = useState(false); // Check if more results available
  const [isSliding, setIsSliding] = useState(false); // For slide animation
  const [activeTab, setActiveTab] = useState('search'); // For tab navigation
  const [trendingGifs, setTrendingGifs] = useState([]); // For trending GIFs
  const [randomGif, setRandomGif] = useState(null); // For random GIF
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('giphyFavorites');
    return saved ? JSON.parse(saved) : [];
  }); // For favorites
  const [downloadProgress, setDownloadProgress] = useState({}); // For download progress
  const [downloadCache, setDownloadCache] = useState(new Map()); // For caching downloads

  // Function to fetch GIFs from Giphy API
  const fetchGifs = async (query, currentOffset = 0, append = false) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    if (!append) {
      setHasSearched(true);
      setOffset(0);
    }
    
    try {
      const apiKey = process.env.REACT_APP_GIPHY_API_KEY;
      
      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error('Please set your Giphy API key in the .env file');
      }

      const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          q: query,
          api_key: apiKey,
          limit: 12,
          offset: currentOffset,
          rating: 'g', // Safe content
        },
      });
      
      console.log('API Response:', response.data);
      
      if (append) {
        setGifs(prevGifs => [...prevGifs, ...response.data.data]);
      } else {
        setGifs(response.data.data);
      }
      
      // Check if there are more results available
      const totalCount = response.data.pagination.total_count;
      const currentCount = currentOffset + response.data.data.length;
      setHasMore(currentCount < totalCount);
      setOffset(currentOffset + 12);
      
    } catch (error) {
      console.error('Error fetching data: ', error);
      
      let errorMessage = 'Failed to fetch GIFs. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = '❌ API Key Error: Invalid or missing Giphy API key. Please check your .env file and restart the server.';
      } else if (error.response?.status === 403) {
        errorMessage = '🚫 Access Forbidden: Your API key may have exceeded rate limits or lacks permissions.';
      } else if (error.response?.status === 429) {
        errorMessage = '⏱️ Rate Limited: Too many requests. Please wait a moment and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = '🌐 Network Error: Please check your internet connection.';
      }
      
      setError(errorMessage);
      if (!append) {
        setGifs([]);
      }
    }
    setLoading(false);
  };

  // Function to fetch trending GIFs
  const fetchTrendingGifs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = process.env.REACT_APP_GIPHY_API_KEY;
      
      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error('Please set your Giphy API key in the .env file');
      }

      const response = await axios.get('https://api.giphy.com/v1/gifs/trending', {
        params: {
          api_key: apiKey,
          limit: 12,
          rating: 'g',
        },
      });
      
      setTrendingGifs(response.data.data);
      
    } catch (error) {
      console.error('Error fetching trending GIFs: ', error);
      setError('Failed to fetch trending GIFs. Please try again.');
    }
    setLoading(false);
  };

  // Function to fetch random GIF
  const fetchRandomGif = async (tag = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = process.env.REACT_APP_GIPHY_API_KEY;
      
      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error('Please set your Giphy API key in the .env file');
      }

      const response = await axios.get('https://api.giphy.com/v1/gifs/random', {
        params: {
          api_key: apiKey,
          tag: tag,
          rating: 'g',
        },
      });
      
      setRandomGif(response.data.data);
      
    } catch (error) {
      console.error('Error fetching random GIF: ', error);
      setError('Failed to fetch random GIF. Please try again.');
    }
    setLoading(false);
  };

  // Handle search button click
  const handleSearch = () => {
    setSearchTerm(inputValue);
    setActiveTab('search');
    fetchGifs(inputValue);
  };

  // Handle category search
  const handleCategorySearch = (category) => {
    setInputValue(category);
    setSearchTerm(category);
    setActiveTab('search');
    fetchGifs(category);
  };

  // Handle trending tab
  const handleTrendingTab = () => {
    setActiveTab('trending');
    if (trendingGifs.length === 0) {
      fetchTrendingGifs();
    }
  };

  // Handle random tab
  const handleRandomTab = () => {
    setActiveTab('random');
    fetchRandomGif();
  };

  // Handle favorites functionality
  const toggleFavorite = (gif) => {
    const newFavorites = favorites.some(fav => fav.id === gif.id)
      ? favorites.filter(fav => fav.id !== gif.id)
      : [...favorites, gif];
    
    setFavorites(newFavorites);
    localStorage.setItem('giphyFavorites', JSON.stringify(newFavorites));
  };

  const isFavorite = (gifId) => {
    return favorites.some(fav => fav.id === gifId);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  // Handle home button click - reset to landing page with slide animation
  const handleHomeClick = () => {
    if (hasSearched && (gifs.length > 0 || trendingGifs.length > 0 || randomGif)) {
      // Start slide-down animation
      setIsSliding(true);
      
      // Wait for animation to complete before clearing results
      setTimeout(() => {
        setGifs([]);
        setTrendingGifs([]);
        setRandomGif(null);
        setSearchTerm('');
        setInputValue('');
        setHasSearched(false);
        setError(null);
        setSelectedGif(null);
        setShowModal(false);
        setOffset(0);
        setHasMore(false);
        setIsSliding(false);
        setActiveTab('search');
      }, 600); // Match the animation duration
    } else {
      // If no results, just reset immediately
      setGifs([]);
      setTrendingGifs([]);
      setRandomGif(null);
      setSearchTerm('');
      setInputValue('');
      setHasSearched(false);
      setError(null);
      setSelectedGif(null);
      setShowModal(false);
      setOffset(0);
      setHasMore(false);
      setIsSliding(false);
      setActiveTab('search');
    }
  };

  // Handle GIF selection for modal
  const handleGifClick = (gif) => {
    setSelectedGif(gif);
    setShowModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGif(null);
  };

  // Optimized Download functions with caching, progress tracking, and parallel downloading
  const downloadGifOptimized = async (url, filename, gifId, size) => {
    const cacheKey = `${gifId}_${size}`;
    
    console.log('=== downloadGifOptimized called ===');
    console.log('URL:', url);
    console.log('Filename:', filename);
    console.log('Cache key:', cacheKey);
    
    try {
      // Check cache first
      if (downloadCache.has(cacheKey)) {
        console.log('Found in cache, using cached blob');
        const cachedBlob = downloadCache.get(cacheKey);
        triggerDownload(cachedBlob, filename);
        return;
      }

      console.log('Not in cache, fetching from URL...');

      // Set loading state
      setDownloadProgress(prev => ({
        ...prev,
        [cacheKey]: { loading: true, progress: 0 }
      }));

      // Try fetch with blob creation first (most reliable for actual downloads)
      console.log('Attempting fetch with blob creation...');
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'image/gif,image/*',
        }
      });

      console.log('Fetch response status:', response.status, response.statusText);
      console.log('Response type:', response.type);

      if (!response.ok) {
        // If CORS fails, try no-cors mode
        console.log('CORS failed, trying no-cors mode...');
        const noCorsResponse = await fetch(url, {
          method: 'GET',
          mode: 'no-cors'
        });
        
        if (noCorsResponse.type === 'opaque') {
          console.log('Got opaque response, using proxy download method...');
          await proxyDownload(url, filename);
          return;
        }
      }

      console.log('Creating blob from response...');
      
      // Use simple blob() method for better compatibility
      const blob = await response.blob();
      
      console.log('Blob created successfully:', blob.size, 'bytes, type:', blob.type);
      
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Empty or invalid blob received');
      }
      
      // Cache the blob for future downloads
      setDownloadCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, blob);
        // Limit cache size to prevent memory issues
        if (newCache.size > 50) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        return newCache;
      });

      // Trigger download
      triggerDownload(blob, filename);
      
      // Clear progress state
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[cacheKey];
          return newProgress;
        });
      }, 1000);

    } catch (error) {
      console.error('Blob download failed:', error);
      
      // Clear progress state on error
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[cacheKey];
        return newProgress;
      });
      
      // Try proxy download as fallback
      try {
        console.log('Attempting proxy download as fallback...');
        await proxyDownload(url, filename);
      } catch (fallbackError) {
        console.error('All download methods failed:', fallbackError);
        // User-friendly error message
        alert('Download failed. You can try right-clicking the GIF and selecting "Save image as..." to download manually.');
      }
    }
  };

  // Proxy download method using fetch with proper headers to force download
  const proxyDownload = async (url, filename) => {
    console.log('=== Proxy download method ===');
    console.log('URL:', url);
    console.log('Filename:', filename);
    
    try {
      // Create a temporary iframe to handle the download
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      
      // Add download attribute handling
      iframe.onload = () => {
        try {
          // Try to trigger download via iframe
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const link = iframeDoc.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
        } catch (iframeError) {
          console.warn('Iframe method failed:', iframeError);
        }
        
        // Remove iframe after attempt
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      };
      
      document.body.appendChild(iframe);
      
      // Also try direct method as backup
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Force download by setting Content-Disposition header simulation
        link.setAttribute('download', filename);
        link.setAttribute('target', '_blank');
        
        document.body.appendChild(link);
        
        // Use multiple click methods
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
          ctrlKey: false,
          altKey: false,
          shiftKey: false,
          metaKey: false
        });
        
        link.dispatchEvent(clickEvent);
        
        // Cleanup
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 1000);
      }, 500);
      
    } catch (error) {
      console.error('Proxy download failed:', error);
      throw error;
    }
  };

  // Debug and test download function
  const testDownload = () => {
    console.log('Testing download functionality...');
    
    // Create a simple test blob
    const testBlob = new Blob(['Hello World'], { type: 'text/plain' });
    const testFilename = 'test_download.txt';
    
    console.log('Test blob created, size:', testBlob.size);
    
    // Test the triggerDownload function
    triggerDownload(testBlob, testFilename);
  };

  // Improved fallback download method that forces download instead of navigation
  const fallbackDownload = async (url, filename) => {
    console.log('=== Fallback download method ===');
    console.log('URL:', url);
    console.log('Filename:', filename);
    
    try {
      // Method 1: Try to fetch and create blob for forced download
      console.log('Fallback: Attempting fetch to create downloadable blob...');
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors'
        });
        
        if (response.ok) {
          const blob = await response.blob();
          if (blob && blob.size > 0) {
            console.log('Fallback: Successfully created blob, triggering download');
            triggerDownload(blob, filename);
            return true;
          }
        }
      } catch (fetchError) {
        console.log('Fallback: Fetch failed, trying alternative methods:', fetchError.message);
      }
      
      // Method 2: Force download using data URL conversion
      console.log('Fallback: Attempting data URL conversion...');
      
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        // Set up image with CORS
        img.crossOrigin = 'anonymous';
        
        const imageLoaded = new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              
              // Convert to blob
              canvas.toBlob((blob) => {
                if (blob) {
                  triggerDownload(blob, filename);
                  resolve(true);
                } else {
                  reject(new Error('Failed to create blob from canvas'));
                }
              }, 'image/gif');
            } catch (canvasError) {
              reject(canvasError);
            }
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          
          // Set timeout for image loading
          setTimeout(() => reject(new Error('Image load timeout')), 10000);
        });
        
        img.src = url;
        await imageLoaded;
        
        console.log('Fallback: Canvas method successful');
        return true;
        
      } catch (canvasError) {
        console.log('Fallback: Canvas method failed:', canvasError.message);
      }
      
      // Method 3: Last resort - download with explicit headers
      console.log('Fallback: Using last resort download method...');
      
      const link = document.createElement('a');
      
      // Try to force download by using data attributes
      link.href = url;
      link.download = filename.replace(/[^a-z0-9._-]/gi, '_');
      link.style.display = 'none';
      link.target = '_self'; // Use _self instead of _blank to avoid popup
      
      // Add additional attributes to force download
      link.setAttribute('download', filename);
      link.setAttribute('type', 'application/octet-stream');
      
      document.body.appendChild(link);
      
      // Force the download by simulating right-click save
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        button: 0, // Left mouse button
        which: 1
      });
      
      link.dispatchEvent(event);
      
      // Cleanup
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 2000);
      
      console.log('Fallback: Direct link method attempted');
      
      // Show user instruction as this method might just open the URL
      setTimeout(() => {
        alert('If the download didn\'t start automatically, right-click on the GIF and select "Save image as..." to download it manually.');
      }, 3000);
      
      return true;
      
    } catch (error) {
      console.error('All fallback download methods failed:', error);
      
      // Final fallback: Inform user to download manually
      alert('Automatic download failed. Please right-click on the GIF and select "Save image as..." to download it manually.');
      
      throw new Error('All download methods failed. Manual download required.');
    }
  };

  // Optimized download trigger with better performance and compatibility
  const triggerDownload = (blob, filename) => {
    try {
      console.log('=== triggerDownload called ===');
      console.log('Filename:', filename);
      console.log('Blob size:', blob.size, 'bytes');
      console.log('Blob type:', blob.type);
      
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Invalid or empty blob');
      }
      
      // Create object URL with error handling
      let downloadUrl;
      try {
        downloadUrl = URL.createObjectURL(blob);
        console.log('Object URL created successfully');
      } catch (urlError) {
        console.error('Failed to create object URL:', urlError);
        throw new Error('Failed to create download URL');
      }
      
      // Create and configure download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename.replace(/[^a-z0-9._-]/gi, '_'); // Sanitize filename
      link.style.display = 'none';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM
      document.body.appendChild(link);
      
      console.log('Download link created and added to DOM');
      
      // Trigger download with multiple fallback methods
      let downloadTriggered = false;
      
      // Method 1: Standard click
      if (typeof link.click === 'function') {
        try {
          link.click();
          downloadTriggered = true;
          console.log('Download triggered via click()');
        } catch (clickError) {
          console.warn('Standard click failed:', clickError);
        }
      }
      
      // Method 2: Dispatch click event (fallback)
      if (!downloadTriggered) {
        try {
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          link.dispatchEvent(clickEvent);
          downloadTriggered = true;
          console.log('Download triggered via dispatchEvent');
        } catch (eventError) {
          console.warn('Event dispatch failed:', eventError);
        }
      }
      
      // Method 3: Direct window.open (last resort)
      if (!downloadTriggered) {
        try {
          window.open(downloadUrl, '_blank');
          console.log('Download triggered via window.open');
        } catch (openError) {
          console.error('window.open failed:', openError);
          throw new Error('All download trigger methods failed');
        }
      }
      
      // Cleanup with extended delay for larger files
      const cleanupDelay = Math.max(2000, Math.min(blob.size / 1000, 10000)); // 2-10 seconds based on file size
      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(downloadUrl);
          console.log('Download cleanup completed');
        } catch (cleanupError) {
          console.warn('Cleanup error (non-critical):', cleanupError);
        }
      }, cleanupDelay);
      
      console.log('Download process completed successfully');
      
    } catch (error) {
      console.error('Error in triggerDownload:', error);
      
      // Last resort: try to open blob URL in new tab
      try {
        const downloadUrl = URL.createObjectURL(blob);
        const newWindow = window.open(downloadUrl, '_blank');
        if (newWindow) {
          console.log('Opened blob in new window as fallback');
          setTimeout(() => {
            alert('The file has been opened in a new window. You can save it from there.');
          }, 1000);
        } else {
          throw new Error('Failed to open new window');
        }
      } catch (fallbackError) {
        console.error('All download methods failed:', fallbackError);
        alert('Download failed. Please try again or check your browser settings.');
      }
    }
  };

  // Enhanced download handler with size optimization
  const handleDownload = (size) => {
    if (!selectedGif) return;
    
    const gifData = selectedGif.images[size];
    if (!gifData) {
      alert('This size is not available for this GIF.');
      return;
    }
    
    // Generate optimized filename
    const title = selectedGif.title || 'giphy';
    const sanitizedTitle = title.substring(0, 50).replace(/[^a-z0-9\s]/gi, ''); // Limit length and sanitize
    const timestamp = Date.now();
    const filename = `${sanitizedTitle}_${size}_${timestamp}.gif`;
    
    // Use optimized download function
    downloadGifOptimized(gifData.url, filename, selectedGif.id, size);
  };

  // Batch download function for multiple GIFs
  const handleBatchDownload = async (sizes = ['original']) => {
    if (!selectedGif) return;
    
    const promises = sizes.map(size => {
      const gifData = selectedGif.images[size];
      if (!gifData) return null;
      
      const title = selectedGif.title || 'giphy';
      const sanitizedTitle = title.substring(0, 50).replace(/[^a-z0-9\s]/gi, '');
      const timestamp = Date.now();
      const filename = `${sanitizedTitle}_${size}_${timestamp}.gif`;
      
      return downloadGifOptimized(gifData.url, filename, selectedGif.id, size);
    }).filter(Boolean);
    
    // Download all sizes in parallel
    await Promise.allSettled(promises);
  };

  // Quick download function for single click downloads
  const handleQuickDownload = (gif, size = 'downsized_large') => {
    console.log('=== Quick Download Started ===');
    console.log('GIF ID:', gif.id);
    console.log('Requested size:', size);
    console.log('Available sizes:', Object.keys(gif.images));
    
    const gifData = gif.images[size] || gif.images.original;
    
    if (!gifData) {
      console.error('No GIF data found for size:', size);
      console.log('Available image data:', gif.images);
      alert('This GIF size is not available. Trying original size...');
      
      if (gif.images.original) {
        const title = gif.title || 'giphy';
        const sanitizedTitle = title.substring(0, 50).replace(/[^a-z0-9\s]/gi, '');
        const timestamp = Date.now();
        const filename = `${sanitizedTitle}_original_${timestamp}.gif`;
        
        console.log('Falling back to original size');
        downloadGifOptimized(gif.images.original.url, filename, gif.id, 'original');
      } else {
        console.error('No original size available either');
        alert('No download options available for this GIF.');
      }
      return;
    }
    
    console.log('GIF data found - URL:', gifData.url);
    console.log('GIF data size:', gifData.width + 'x' + gifData.height);
    
    const title = gif.title || 'giphy';
    const sanitizedTitle = title.substring(0, 50).replace(/[^a-z0-9\s]/gi, '');
    const timestamp = Date.now();
    const filename = `${sanitizedTitle}_${size}_${timestamp}.gif`;
    
    console.log('Generated filename:', filename);
    console.log('Starting download via downloadGifOptimized...');
    
    downloadGifOptimized(gifData.url, filename, gif.id, size);
  };

  // Handle load more button click
  const handleLoadMore = () => {
    if (searchTerm && hasMore) {
      fetchGifs(searchTerm, offset, true);
    }
  };

  return (
    <>
      {/* SVG Blob Animation Background */}
      <div className="svg-background">
        <svg preserveAspectRatio="xMidYMid slice" viewBox="10 10 80 80">
          <path fill={darkMode ? "#4a5568" : "#9b5de5"} className="out-top" d="M37-5C25.1-14.7,5.7-19.1-9.2-10-28.5,1.8-32.7,31.1-19.8,49c15.5,21.5,52.6,22,67.2,2.3C59.4,35,53.7,8.5,37-5Z"/>
          <path fill={darkMode ? "#2d3748" : "#f15bb5"} className="in-top" d="M20.6,4.1C11.6,1.5-1.9,2.5-8,11.2-16.3,23.1-8.2,45.6,7.4,50S42.1,38.9,41,24.5C40.2,14.1,29.4,6.6,20.6,4.1Z"/>
          <path fill={darkMode ? "#1a202c" : "#00bbf9"} className="out-bottom" d="M105.9,48.6c-12.4-8.2-29.3-4.8-39.4.8-23.4,12.8-37.7,51.9-19.1,74.1s63.9,15.3,76-5.6c7.6-13.3,1.8-31.1-2.3-43.8C117.6,63.3,114.7,54.3,105.9,48.6Z"/>
          <path fill={darkMode ? "#2c5282" : "#00f5d4"} className="in-bottom" d="M102,67.1c-9.6-6.1-22-3.1-29.5,2-15.4,10.7-19.6,37.5-7.6,47.8s35.9,3.9,44.5-12.5C115.5,92.6,113.9,74.6,102,67.1Z"/>
        </svg>
      </div>
      
      <div className={`App ${hasSearched ? 'searched' : 'centered'} ${darkMode ? 'dark-mode' : ''}`}>
        {/* Top Controls */}
        <div className="top-controls">
          {/* Dark Mode Toggle */}
          <label className="switch">
            <input 
              type="checkbox" 
              checked={darkMode}
              onChange={handleDarkModeToggle}
            />
            <span className="slider"></span>
          </label>
          
          {/* Home Button */}
          <button className="home-button" onClick={handleHomeClick} title="Go to Home">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <h1>GiphLoopify</h1>
        
        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Search
          </button>
          <button 
            className={`nav-tab ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={handleTrendingTab}
          >
            🔥 Trending
          </button>
          <button 
            className={`nav-tab ${activeTab === 'random' ? 'active' : ''}`}
            onClick={handleRandomTab}
          >
            🎲 Random
          </button>
          <button 
            className={`nav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            ❤️ Favorites ({favorites.length})
          </button>
        </div>

        {/* Search Section */}
        {activeTab === 'search' && (
          <>
            {/* Category Buttons */}
            <div className="category-buttons">
              <button className="category-btn" onClick={() => handleCategorySearch('funny')}>
                😂 Funny
              </button>
              <button className="category-btn" onClick={() => handleCategorySearch('cats')}>
                🐱 Cats
              </button>
              <button className="category-btn" onClick={() => handleCategorySearch('dogs')}>
                🐶 Dogs
              </button>
              <button className="category-btn" onClick={() => handleCategorySearch('reactions')}>
                😮 Reactions
              </button>
              <button className="category-btn" onClick={() => handleCategorySearch('sports')}>
                ⚽ Sports
              </button>
              <button className="category-btn" onClick={() => handleCategorySearch('movies')}>
                🎬 Movies
              </button>
            </div>
            
            <div className="search-container">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for GIFs (e.g., cats, funny, dogs)"
                className="search-input"
              />
              <button
                onClick={handleSearch}
                className="search-button"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Unleash'}
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading"></div>
        ) : (
          <>
            {/* Search Results */}
            {activeTab === 'search' && (
              <div className={`gif-container ${isSliding ? 'slide-down' : ''}`}>
                {hasSearched && gifs.length > 0 ? (
                  gifs.map((gif) => (
                    <div key={gif.id} className={`gif-card ${isSliding ? 'slide-down' : ''}`}>
                      <img
                        src={gif.images.fixed_height.url}
                        alt={gif.title || 'GIF'}
                        className="gif-image"
                        loading="lazy"
                        onClick={() => handleGifClick(gif)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="gif-card-footer">
                        <p className="gif-title">{gif.title || 'Untitled GIF'}</p>
                        <div className="gif-actions">
                          <button 
                            className="quick-download-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickDownload(gif);
                            }}
                            title="Quick Download"
                          >
                            ⬇️
                          </button>
                          <button 
                            className={`favorite-btn ${isFavorite(gif.id) ? 'favorited' : ''}`}
                            onClick={() => toggleFavorite(gif)}
                          >
                            {isFavorite(gif.id) ? '❤️' : '🤍'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : hasSearched && gifs.length === 0 && !error ? (
                  <div className="no-results">
                    No GIFs found for "{searchTerm}". Try a different search term!
                  </div>
                ) : null}
              </div>
            )}

            {/* Trending Results */}
            {activeTab === 'trending' && (
              <div className="gif-container">
                {trendingGifs.length > 0 ? (
                  trendingGifs.map((gif) => (
                    <div key={gif.id} className="gif-card">
                      <img
                        src={gif.images.fixed_height.url}
                        alt={gif.title || 'GIF'}
                        className="gif-image"
                        loading="lazy"
                        onClick={() => handleGifClick(gif)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="gif-card-footer">
                        <p className="gif-title">{gif.title || 'Untitled GIF'}</p>
                        <div className="gif-actions">
                          <button 
                            className="quick-download-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickDownload(gif);
                            }}
                            title="Quick Download"
                          >
                            ⬇️
                          </button>
                          <button 
                            className={`favorite-btn ${isFavorite(gif.id) ? 'favorited' : ''}`}
                            onClick={() => toggleFavorite(gif)}
                          >
                            {isFavorite(gif.id) ? '❤️' : '🤍'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    🔥 Loading trending GIFs...
                  </div>
                )}
              </div>
            )}

            {/* Random GIF */}
            {activeTab === 'random' && (
              <div className="random-section">
                <div className="random-controls">
                  <button className="surprise-btn" onClick={() => fetchRandomGif()}>
                    🎲 Surprise Me!
                  </button>
                  <button className="surprise-btn" onClick={() => fetchRandomGif('funny')}>
                    😂 Random Funny
                  </button>
                  <button className="surprise-btn" onClick={() => fetchRandomGif('animals')}>
                    🐶 Random Animals
                  </button>
                </div>
                {randomGif && (
                  <div className="random-gif-container">
                    <div className="gif-card random-gif-card">
                      <img
                        src={randomGif.images.fixed_height.url}
                        alt={randomGif.title || 'Random GIF'}
                        className="gif-image"
                        onClick={() => handleGifClick(randomGif)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="gif-card-footer">
                        <p className="gif-title">{randomGif.title || 'Random GIF'}</p>
                        <div className="gif-actions">
                          <button 
                            className="quick-download-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickDownload(randomGif);
                            }}
                            title="Quick Download"
                          >
                            ⬇️
                          </button>
                          <button 
                            className={`favorite-btn ${isFavorite(randomGif.id) ? 'favorited' : ''}`}
                            onClick={() => toggleFavorite(randomGif)}
                          >
                            {isFavorite(randomGif.id) ? '❤️' : '🤍'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Favorites */}
            {activeTab === 'favorites' && (
              <div className="gif-container">
                {favorites.length > 0 ? (
                  favorites.map((gif) => (
                    <div key={gif.id} className="gif-card">
                      <img
                        src={gif.images.fixed_height.url}
                        alt={gif.title || 'GIF'}
                        className="gif-image"
                        loading="lazy"
                        onClick={() => handleGifClick(gif)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="gif-card-footer">
                        <p className="gif-title">{gif.title || 'Untitled GIF'}</p>
                        <div className="gif-actions">
                          <button 
                            className="quick-download-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickDownload(gif);
                            }}
                            title="Quick Download"
                          >
                            ⬇️
                          </button>
                          <button 
                            className="favorite-btn favorited"
                            onClick={() => toggleFavorite(gif)}
                          >
                            ❤️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    🤍 No favorites yet! Add some GIFs to your favorites by clicking the heart button.
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Load More Button - Only for search results */}
        {activeTab === 'search' && hasSearched && gifs.length > 0 && hasMore && !loading && (
          <div className="load-more-container">
            <button
              onClick={handleLoadMore}
              className="load-more-button"
              disabled={loading}
            >
              Load More GIFs
            </button>
          </div>
        )}

        {/* Download Modal */}
        {showModal && selectedGif && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="card">
                <div className="img">
                  <img
                    src={selectedGif.images.original.url}
                    alt={selectedGif.title || 'GIF'}
                    className="modal-gif"
                  />
                  <div className="save" onClick={handleCloseModal}>
                    <svg className="svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="text">
                  <h3 className="h3">{selectedGif.title || 'Untitled GIF'}</h3>
                  <p className="p">Choose your preferred download size or download all</p>
                  
                  {/* Batch Download Button */}
                  <div className="batch-download-section">
                    <button 
                      className="batch-download-btn"
                      onClick={() => handleBatchDownload(['original', 'downsized_large', 'fixed_height', 'fixed_width_small'])}
                    >
                      📦 Download All Sizes
                    </button>
                  </div>
                  
                  <div className="download-options">
                    <div className="icon-box" onClick={() => handleDownload('original')}>
                      <div className="download-content">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="span">Original ({selectedGif.images.original.width}×{selectedGif.images.original.height})</span>
                      </div>
                      {downloadProgress[`${selectedGif.id}_original`] && (
                        <div className="download-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${downloadProgress[`${selectedGif.id}_original`].progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{downloadProgress[`${selectedGif.id}_original`].progress || 0}%</span>
                        </div>
                      )}
                    </div>
                    <div className="icon-box" onClick={() => handleDownload('downsized_large')}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="span">Large ({selectedGif.images.downsized_large.width}×{selectedGif.images.downsized_large.height})</span>
                    </div>
                    <div className="icon-box" onClick={() => handleDownload('fixed_height')}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="span">Medium ({selectedGif.images.fixed_height.width}×{selectedGif.images.fixed_height.height})</span>
                    </div>
                    <div className="icon-box" onClick={() => handleDownload('fixed_width_small')}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="span">Small ({selectedGif.images.fixed_width_small.width}×{selectedGif.images.fixed_width_small.height})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;