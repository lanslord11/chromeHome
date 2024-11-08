import React from "react";

import { Bookmark, ChevronRight, Folder, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

const transformBrowserBookmarks = (browserBookmarks) => {
    function transform(node) {
      const result = {
        id: node.id,
        name: node.title,
        type: node.url ? "bookmark" : "folder",
        children: {},
      };
  
      if (node.url) {
        result.type = "bookmark";
        result.url = node.url;
      } else {
        result.type = "folder";
        if (node.children) {
          node.children.forEach((child) => {
            // Use the title as the key for easier navigation
            result.children[child.title] = transform(child);
          });
        }
      }
  
      return result;
    }
  
    // Create root node to match our data structure
    return {
      root: {
        id: "root",
        name: "Bookmarks",
        type: "folder",
        children: browserBookmarks[0].children.reduce((acc, child) => {
          acc[child.title] = transform(child);
          return acc;
        }, {}),
      },
    };
  };

const Tooltip = ({ children, target }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (target.current) {
      const rect = target.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      let left = rect.left;
      let top = rect.bottom + 10; // 10px below the target

      // Check horizontal positioning
      if (tooltipRef.current) {
        const tooltipWidth = tooltipRef.current.offsetWidth;
        if (left + tooltipWidth > viewportWidth) {
          left = viewportWidth - tooltipWidth - 10; // 10px from right edge
        }
      }

      setPosition({ top, left });
    }
  }, [target]);

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-[#1a2942] p-2 rounded-md shadow-lg text-[#ccd6f6] text-sm whitespace-nowrap"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

const BookMarks = () => {
  const [currentPath, setCurrentPath] = useState(["root"]);
  const [loading, setLoading] = useState(true);

  const [bookmarkData, setBookmarkData] = useState(null);
  const tooltipRefs = useRef({});
  const [activeTooltip, setActiveTooltip] = useState(null);

  const getPathNames = () => {
    if (!bookmarkData) return [];
    let current = bookmarkData.root;
    return currentPath.map((id) => {
      if (id === "root") return current;
      current = current.children[id];
      return current;
    });
  };
  const pathNames = getPathNames();

  const getCurrentFolder = () => {
    if (!bookmarkData) return null;
    let current = bookmarkData.root;
    for (let i = 1; i < currentPath.length; i++) {
      current = current.children[currentPath[i]];
    }
    return current;
  };
  const currentFolder = getCurrentFolder();

  const navigateTo = (index) => {
    setCurrentPath((prev) => prev.slice(0, index + 1));
  };

  const enterFolder = (folderName) => {
    setCurrentPath((prev) => [...prev, folderName]);
  };

  useEffect(() => {
    // Function to load bookmarks
    const loadBookmarks = async () => {
      try {
        // Check if we're in a browser extension environment
        if (typeof chrome !== "undefined" && chrome.bookmarks) {
          // Chrome bookmarks API
          chrome.bookmarks.getTree((tree) => {
            const transformedData = transformBrowserBookmarks(tree);
            setBookmarkData(transformedData);
            setLoading(false);
          });
        } else if (typeof browser !== "undefined" && browser.bookmarks) {
          // Firefox bookmarks API
          const tree = await browser.bookmarks.getTree();
          const transformedData = transformBrowserBookmarks(tree);
          setBookmarkData(transformedData);
          setLoading(false);
        } else {
          // Development environment - use sample data
          console.warn(
            "Browser bookmarks API not available, using sample data"
          );
          // Insert your sample data here
          setBookmarkData(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading bookmarks:", error);
        setLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-[#ccd6f6]">Loading bookmarks...</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center space-x-2 mb-4">
            <Bookmark className="w-6 h-6 text-[#bd93f9]" />
            <h2 className="text-xl font-bold text-[#ccd6f6]">
              Stellar Bookmarks
            </h2>
          </div>

          {/* Path Navigation */}
          <div className="flex items-center space-x-2 mb-4 bg-[#1a2942] p-2 rounded-md overflow-x-auto">
            {pathNames.map((item, index) => (
              <React.Fragment key={item.id}>
                <button
                  onClick={() => navigateTo(index)}
                  className="text-[#ccd6f6] hover:text-[#bd93f9] transition-colors duration-300 whitespace-nowrap"
                >
                  {item.name}
                </button>
                {index < pathNames.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-[#bd93f9] flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-grow overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {/* Folders */}
              {Object.entries(currentFolder?.children || {})
                .filter(([_, item]) => item.type === "folder")
                .map(([name, folder]) => (
                  <div
                    key={folder.id}
                    className="relative group"
                    onMouseEnter={() => {
                      tooltipRefs.current[folder.id] = React.createRef();
                      setActiveTooltip({
                        id: folder.id,
                        name: folder.name,
                        ref: tooltipRefs.current[folder.id],
                      });
                    }}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <button
                      ref={tooltipRefs.current[folder.id]}
                      onClick={() => enterFolder(name)}
                      className="w-full flex items-center space-x-2 p-3 rounded-md hover:bg-[#bd93f9]/20 transition-all duration-300"
                    >
                      <Folder className="w-5 h-5 text-[#bd93f9] flex-shrink-0" />
                      <span className="text-[#ccd6f6] truncate">
                        {folder.name}
                      </span>
                    </button>
                  </div>
                ))}

              {/* Bookmarks */}
              {Object.entries(currentFolder?.children || {})
                .filter(([_, item]) => item.type === "bookmark")
                .map(([_, bookmark]) => (
                  <div
                    key={bookmark.id}
                    className="relative group"
                    onMouseEnter={() => {
                      tooltipRefs.current[bookmark.id] = React.createRef();
                      setActiveTooltip({
                        id: bookmark.id,
                        name: bookmark.name,
                        ref: tooltipRefs.current[bookmark.id],
                      });
                    }}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <a
                      href={bookmark.url}
                      ref={tooltipRefs.current[bookmark.id]}
                      className="w-full flex items-center space-x-2 p-3 rounded-md hover:bg-[#bd93f9]/20 transition-all duration-300"
                    >
                      <Star className="w-5 h-5 text-[#bd93f9] flex-shrink-0" />
                      <span className="text-[#ccd6f6] truncate">
                        {bookmark.name}
                      </span>
                    </a>
                  </div>
                ))}
            </div>
          </div>

          {/* Tooltip Portal */}
          {activeTooltip && (
            <Tooltip target={activeTooltip.ref}>{activeTooltip.name}</Tooltip>
          )}
        </>
      )}
    </>
  );
};

export default BookMarks;
