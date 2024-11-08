import React from "react";
import { Code } from "lucide-react";
import { useEffect, useState } from "react";

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/contests");
        const data = await response.json();
        setContests(data);
      } catch (error) {
        console.error("Error fetching contests:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchContests();
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
