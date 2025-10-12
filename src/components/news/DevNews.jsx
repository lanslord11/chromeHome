import React, { useEffect, useRef, useState } from "react";
import { Newspaper } from "lucide-react";

// Constants
const CACHE_KEY = 'devNewsCache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const DevNews = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRefForNews = useRef(null);
  const scrollIntervalRef = useRef(null); // Use useRef to persist the interval ID

  const startScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
  
    scrollIntervalRef.current = setInterval(() => {
      const scrollContainer = scrollContainerRefForNews.current;
      if (scrollContainer) {
        // Add a small buffer (1px) to account for rounding errors
        if (
          Math.ceil(scrollContainer.scrollTop + scrollContainer.clientHeight + 1) >=
          scrollContainer.scrollHeight
        ) {
          // Reset to top and add a small delay before continuing
          scrollContainer.scrollTop = 0;
          clearInterval(scrollIntervalRef.current);
          
          // Restart scrolling after a brief pause
          setTimeout(() => {
            startScrolling();
          }, 1000);
        } else {
          scrollContainer.scrollTop += 1;
        }
      }
    }, 20);
  };


  const getCachedNews = () => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;
      if (!isExpired) {
        return data;
      }
    }
    return null;
  };

  const setCachedNews = (data) => {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  };

  const fetchNews = async () => {
    try {
      const response = await fetch("https://chrome-home-server.vercel.app/api/news", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      
      const data = await response.json();
      setNewsItems(data);
      setCachedNews(data);
      setIsLoading(false);

     

    } catch (error) {
      console.error("Error fetching news:", error);
      setIsLoading(false);
    }
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null; // Ensure the interval is cleared
    }
  };

  // Initialize with cached data and update in background
  useEffect(() => {
    const loadNews = async () => {
      // Try to load from cache first
      const cachedNews = getCachedNews();
      if (cachedNews) {
        setNewsItems(cachedNews);
        setIsLoading(false);
        
        // Update cache in background
        fetchNews();
      } else {
        // No cache, fetch directly
        await fetchNews();
      }
      startScrolling();

    };

    loadNews();
    return ()=>stopScrolling();
  }, []);

  // // Auto-scroll effect
  // useEffect(() => {
  //   // const scrollContainer = scrollContainerRefForNews.current;
  //   // const startScrolling = () => {
  //   //   scrollInterval = setInterval(() => {
  //   //     if (scrollContainer) {
  //   //       if (
  //   //         scrollContainer.scrollTop + scrollContainer.clientHeight >=
  //   //         scrollContainer.scrollHeight
  //   //       ) {
  //   //         scrollContainer.scrollTop = 0;
  //   //       } else {
  //   //         scrollContainer.scrollTop += 1;
  //   //       }
  //   //     }
  //   //   }, 20);
  //   // };

  //   startScrolling();

  //   return () => clearInterval(scrollInterval);
  // }, []);

  // Mouse enter/leave handlers for scroll control
  const handleMouseEnter = () => {
    stopScrolling();
    const scrollContainer = scrollContainerRefForNews.current;
    if (scrollContainer) {
      scrollContainer.style.scrollBehavior = 'auto';
      scrollContainer.style.overflowY = 'auto';
    }
  };

  const handleMouseLeave = () => {
    startScrolling();
    const scrollContainer = scrollContainerRefForNews.current;
    if (scrollContainer) {
      scrollContainer.style.scrollBehavior = 'smooth';
      scrollContainer.style.overflowY = 'hidden';
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2 mb-4">
        <Newspaper className="w-6 h-6 text-[#ff79c6]" />
        <h2 className="text-xl font-bold text-[#ccd6f6]">Galactic News</h2>
      </div>
      <div
        ref={scrollContainerRefForNews}
        className="scroll-container h-32 overflow-y-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-[#8892b0]">
            Loading news...
          </div>
        ) : (
          <ul className="space-y-2">
            {newsItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:bg-[#ff79c6]/20 p-2 rounded transition-colors duration-300"
                >
                  <h3 className="font-semibold text-[#ff79c6]">{item.title}</h3>
                  <p className="text-sm text-[#8892b0]">{item.desc}</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default DevNews;