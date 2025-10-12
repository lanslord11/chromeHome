import React from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Globe,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

const CACHE_KEY = 'hackathonsCache';
const CACHE_DURATION = 60 * 60 * 1000; 

const Hackathons = () => {
  const [hackathons, setHackathons] = useState([]);
  const [hackathonLoading, setHackathonLoading] = useState(true);
  const [hackathonError, setHackathonError] = useState(null);
  const scrollContainerRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const HackathonCard = ({ hackathon }) => (
    <a href={hackathon.url} target="_blank" rel="noopener noreferrer">
    <div className="flex-shrink-0 w-[400px] bg-[#112240] rounded-lg p-4 border border-[#50fa7b]/30 transition-all duration-300 hover:border-[#50fa7b] hover:shadow-md hover:shadow-[#50fa7b]/20 flex flex-col justify-between">
      {" "}
      <div>
        <h3 className="text-xl font-semibold text-[#ccd6f6] mb-3 truncate">
          {hackathon.title}
        </h3>
        <ul className="space-y-3">
          <li className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-[#50fa7b]" />
            <span className="text-[#8892b0] text-base">
              {hackathon.location}
            </span>
          </li>
          <li className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#50fa7b]" />
            <span className="text-[#8892b0] text-base font-medium">
              {hackathon.time_left_to_submission}
            </span>
          </li>
          <li className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-[#50fa7b]" />
            <span className="text-[#8892b0] text-sm">
              Prize: {hackathon.prize}
            </span>
          </li>
        </ul>
      </div>
      {hackathon.themes.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-semibold text-[#ccd6f6] mb-1">Themes:</h4>
          <div className="flex flex-wrap gap-1">
            {hackathon.themes.slice(0, 3).map((theme, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 rounded-full bg-[#50fa7b]/10 text-[#50fa7b]"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
    </a>
  );

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const scroll = useCallback((direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  const handleWheel = (e) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
    let intervalId;

    const autoScroll = () => {
      if (scrollContainerRef.current && !isHovering) {
        const containerWidth = scrollContainerRef.current.offsetWidth;
        const cardWidth = 400; // Assuming each card is 300px wide
        const totalCards = hackathons.length;

        setCurrentCardIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % totalCards;
          scrollContainerRef.current.scrollTo({
            left: nextIndex * cardWidth,
            behavior: "smooth",
          });
          return nextIndex;
        });
      }
    };

    intervalId = setInterval(autoScroll, 3000); // Scroll every 3 seconds

    return () => clearInterval(intervalId);
  }, [isHovering, hackathons.length]);

  const getCachedHackathons = () => {
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

  const setCachedHackathons = (data) => {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  };
  const transformHackathonData = (data) => {
    return data.map((hackathon) => ({
      id: hackathon.id,
      title: hackathon.title,
      location: hackathon.location,
      time_left_to_submission: hackathon.time_left_to_submission,
      dates: hackathon.dates,
      url: hackathon.url,
      prize: hackathon.prize_amount
        ? hackathon.prize_amount.replace(/<[^>]*>/g, "")
        : "Not specified",
      organization: hackathon.organization,
      themes: hackathon.themes,
    }));
  };

  const fetchHackathons = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_CHROME_HOME_SERVER_URL}/hackathons`
      );
      if (!response.ok) throw new Error("Failed to fetch hackathons");
      const data = await response.json();
      const transformedData = transformHackathonData(data);
      
      setHackathons(transformedData);
      setCachedHackathons(transformedData);
      setHackathonLoading(false);
      return transformedData;
    } catch (err) {
      setHackathonError(err.message);
      setHackathonLoading(false);
      throw err;
    }
  };

  useEffect(() => {
    const loadHackathons = async () => {
      const cachedHackathons = getCachedHackathons();
      if (cachedHackathons) {
        setHackathons(cachedHackathons);
        setHackathonLoading(false);
        
        // Update cache in background
        try {
          await fetchHackathons();
        } catch (error) {
          console.error("Background cache update failed:", error);
        }
      } else {
        try {
          await fetchHackathons();
        } catch (error) {
          console.error("Initial fetch failed:", error);
        }
      }
    };

    loadHackathons();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-[#50fa7b]" />
          <h2 className="text-xl font-bold text-[#ccd6f6]" >
            Upcoming Hackathons
          </h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => scroll("left")}
            className="p-1 rounded-full bg-[#50fa7b]/20 text-[#50fa7b] hover:bg-[#50fa7b]/30 transition-colors duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1 rounded-full bg-[#50fa7b]/20 text-[#50fa7b] hover:bg-[#50fa7b]/30 transition-colors duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {hackathonLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#50fa7b]"></div>
        </div>
      ) : hackathonError ? (
        <div className="flex items-center justify-center h-64 text-[#ff5555]">
          Error: {hackathonError}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        >
          {hackathons.map((hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon}  />
          ))}
        </div>
      )}
    </>
  );
};

export default Hackathons;
