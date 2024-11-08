import React from "react";
import { useEffect, useRef, useState } from "react";
import { Newspaper } from "lucide-react";

const DevNews = () => {
  const [newsItems, setNewsItems] = useState([]);
  useEffect(() => {
    // Fetch the news items from the server
    const fetchNews = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/news");
        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }
        const data = await response.json();
        setNewsItems(data);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };
    fetchNews();
  }, []);

  const scrollContainerRefForNews = useRef(null);
  useEffect(() => {
    const scrollContainer = scrollContainerRefForNews.current;
    let scrollInterval;

    const startScrolling = () => {
      scrollInterval = setInterval(() => {
        if (scrollContainer) {
          if (
            scrollContainer.scrollTop + scrollContainer.clientHeight >=
            scrollContainer.scrollHeight
          ) {
            scrollContainer.scrollTop = 0;
          } else {
            scrollContainer.scrollTop += 1; // Adjust the scroll speed as needed
          }
        }
      }, 20); // Adjust the interval as needed
    };

    startScrolling();

    return () => clearInterval(scrollInterval);
  }, []);

  return (
    <>
      <div className="flex items-center space-x-2 mb-4">
        <Newspaper className="w-6 h-6 text-[#ff79c6]" />
        <h2 className="text-xl font-bold text-[#ccd6f6]">Galactic News</h2>
      </div>
      <div
        ref={scrollContainerRefForNews}
        className="scroll-container h-32 overflow-y-auto"
      >
        <ul className="space-y-2">
          {newsItems.map((item, index) => (
            <li key={index}>
              <a
                href={item.link}
                className="block hover:bg-[#ff79c6]/20 p-2 rounded transition-colors duration-300"
              >
                <h3 className="font-semibold text-[#ff79c6]">{item.title}</h3>
                <p className="text-sm text-[#8892b0]">{item.desc}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default DevNews;
