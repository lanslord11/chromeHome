import React from "react";
import { Code } from "lucide-react";
import { useEffect, useState } from "react";

const CACHE_KEY = 'contestsCache';
const CACHE_DURATION = 15 * 60 * 1000;

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);

  const getCachedContests = () => {
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

  const setCachedContests = (data) => {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  };

  const fetchContests = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_CHROME_HOME_SERVER_URL}/contests`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch contests');
      }

      const data = await response.json();
      setContests(data);
      setCachedContests(data);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsFetching(false);
    }
  };


  useEffect(() => {
    const loadContests = async () => {
      // Try to load from cache first
      const cachedContests = getCachedContests();
      if (cachedContests) {
        setContests(cachedContests);
        setIsFetching(false);
        
        // Update cache in background
        try {
          await fetchContests();
        } catch (error) {
          console.error("Background cache update failed:", error);
        }
      } else {
        // No cache, fetch directly
        try {
          await fetchContests();
        } catch (error) {
          console.error("Initial fetch failed:", error);
        }
      }
    };

    loadContests();

    // Optional: Set up periodic background refresh
    const refreshInterval = setInterval(() => {
      fetchContests().catch(console.error);
    }, CACHE_DURATION);

    return () => clearInterval(refreshInterval);
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = (duration) => {
    const hours = Math.floor(duration / (1000 * 60 * 60));
    return `${hours}h`;
  };
  return (
    <>
      <div className="flex items-center space-x-2 mb-4">
        <Code className="w-6 h-6 text-[#ffb86c]" />
        <h2 className="text-xl font-bold text-[#ccd6f6]">Coding Quests</h2>
      </div>

      <div className="scroll-container h-28 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2">
          {isFetching ? (
            <li className="text-[#ffb86c]">Loading contests...</li>
          ) : (
            contests.map((contest, index) => (
              <li key={index}>
                <a
                  href={contest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between hover:bg-[#ffb86c]/20 p-2 rounded transition-colors duration-300"
                >
                  <div className="flex flex-col flex-1 mr-4">
                    <span className="text-[#ccd6f6] font-medium truncate">
                      {contest.title}
                    </span>
                    <div className="flex items-center space-x-2 text-sm text-[#8892b0]">
                      <span className="uppercase">{contest.site}</span>
                      <span>•</span>
                      <span>{formatDate(contest.startTime)}</span>
                      <span>•</span>
                      <span>{getDuration(contest.duration)}</span>
                    </div>
                  </div>
                  <button className="border border-[#ffb86c] text-[#ffb86c] hover:bg-[#ffb86c] hover:text-[#0a192f] transition-colors duration-300 px-2 py-1 rounded-md text-sm whitespace-nowrap">
                    Join
                  </button>
                </a>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
};

export default Contests;
