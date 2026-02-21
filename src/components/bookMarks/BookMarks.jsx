
import React from "react";
import fuzzysort from "fuzzysort";

import {
  Bookmark,
  ChevronRight,
  Folder,
  Star,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a2942] rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#ccd6f6] hover:text-[#bd93f9]"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a2942] rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#ccd6f6] mb-4">
          Confirm Delete
        </h3>
        <p className="text-[#ccd6f6] mb-6">
          Are you sure you want to delete {itemType} "{itemName}"?
          {itemType === "folder" &&
            " This will delete all contents inside the folder."}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#ccd6f6] hover:text-[#bd93f9]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ContextMenu = ({ x, y, onClose, options }) => {
  return ReactDOM.createPortal(
    <div
      className="fixed bg-[#1a2942] rounded-md shadow-lg py-1 z-50"
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          className={`w-full px-4 py-2 text-left flex items-center space-x-2 ${
            option.destructive
              ? "text-red-400 hover:bg-red-500/20"
              : "text-[#ccd6f6] hover:bg-[#bd93f9]/20"
          }`}
          onClick={() => {
            option.onClick();
            onClose();
          }}
        >
          {option.icon && <span>{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
};

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
  // All hooks must be declared at the top
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [currentPath, setCurrentPath] = useState(["root"]);
  const [loading, setLoading] = useState(true);
  const [bookmarkData, setBookmarkData] = useState(null);
  const tooltipRefs = useRef({});
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState(null); // 'folder' or 'bookmark'
  const [newItemData, setNewItemData] = useState({ title: "", url: "" });
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // Helper: Flatten bookmarks/folders for search
  const flattenBookmarks = (node, path = []) => {
    let items = [];
    if (!node) return items;
    if (node.type === "bookmark") {
      items.push({
        id: node.id,
        name: node.name,
        url: node.url,
        type: "bookmark",
        path: [...path],
      });
    } else if (node.type === "folder") {
      items.push({
        id: node.id,
        name: node.name,
        type: "folder",
        path: [...path],
      });
      if (node.children) {
        Object.values(node.children).forEach(child => {
          items = items.concat(flattenBookmarks(child, [...path, node.name]));
        });
      }
    }
    return items;
  };

  // Fuzzy search logic
  React.useEffect(() => {
    if (!searchQuery || !bookmarkData) {
      setSearchResults([]);
      return;
    }
    const allItems = flattenBookmarks(bookmarkData.root);
    // Search by name and url (for bookmarks)
    const results = fuzzysort.go(
      searchQuery,
      allItems,
      {
        keys: [
          "name",
          item => (item.type === "bookmark" ? item.url : "")
        ],
        limit: 5,
        threshold: -10000,
      }
    );
    setSearchResults(results.map(r => r.obj));
  }, [searchQuery, bookmarkData]);

  const handleDragStart = (e, item, type) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        id: item.id,
        name: item.name,
        type,
      })
    );
    setDraggedItem({ ...item, type });
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Allow dropping
  };

  const handleDropOnFolder = async (e, targetFolder) => {
    e.preventDefault();
    if (!draggedItem) return;

    try {
      // Prevent dropping an item into itself or its children
      if (draggedItem.id === targetFolder.id) return;

      // Move bookmark or folder
      if (draggedItem.type === "bookmark") {
        await chrome.bookmarks.move(draggedItem.id, {
          parentId: targetFolder.id,
        });
      } else if (draggedItem.type === "folder") {
        await chrome.bookmarks.move(draggedItem.id, {
          parentId: targetFolder.id,
        });
      }

      // Refresh bookmarks
      chrome.bookmarks.getTree((tree) => {
        const transformedData = transformBrowserBookmarks(tree);
        setBookmarkData(transformedData);
      });

      setDraggedItem(null);
    } catch (error) {
      console.error("Error moving item:", error);
    }
  };

  const handleDropOnNavigation = async (e, targetIndex) => {
    e.preventDefault();
    if (!draggedItem) return;

    try {
      // Find the correct parent to move the item to
      const navigationPath = currentPath.slice(0, targetIndex + 1);
      let parentFolder = bookmarkData.root;

      for (let i = 1; i < navigationPath.length; i++) {
        parentFolder = parentFolder.children[navigationPath[i]];
      }

      // Move bookmark or folder
      await chrome.bookmarks.move(draggedItem.id, {
        parentId: parentFolder.id,
      });

      // Refresh bookmarks and update current path
      chrome.bookmarks.getTree((tree) => {
        const transformedData = transformBrowserBookmarks(tree);
        setBookmarkData(transformedData);

        // Update current path to reflect the new location
        setCurrentPath(navigationPath);
      });

      setDraggedItem(null);
    } catch (error) {
      console.error("Error moving item:", error);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.type === "bookmark") {
        // Delete specific bookmark
        await chrome.bookmarks.remove(deleteItem.id);
      } else if (deleteItem.type === "folder") {
        // Recursively remove folder and all its contents
        await chrome.bookmarks.removeTree(deleteItem.id);
      }

      // Refresh bookmarks
      chrome.bookmarks.getTree((tree) => {
        const transformedData = transformBrowserBookmarks(tree);
        setBookmarkData(transformedData);

        // If the deleted item was in the current path, navigate back
        if (currentPath.includes(deleteItem.name)) {
          setCurrentPath(["root"]);
        }
      });

      // Close modals and reset state
      setIsConfirmDeleteModalOpen(false);
      setDeleteItem(null);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();

    const options = [];

    if (item.type === "folder") {
      options.push(
        {
          label: "New Bookmark",
          onClick: () => {
            setCreateMode("bookmark");
            setIsCreateModalOpen(true);
          },
          icon: <Plus className="w-4 h-4" />,
        },
        {
          label: "New Folder",
          onClick: () => {
            setCreateMode("folder");
            setIsCreateModalOpen(true);
          },
          icon: <Folder className="w-4 h-4" />,
        },
        {
          label: "Delete Folder",
          onClick: () => {
            setDeleteItem({
              id: item.id,
              name: item.name,
              type: "folder",
            });
            setIsConfirmDeleteModalOpen(true);
          },
          icon: <Trash2 className="w-4 h-4" />,
          destructive: true,
        }
      );
    } else if (item.type === "bookmark") {
      options.push({
        label: "Delete Bookmark",
        onClick: () => {
          setDeleteItem({
            id: item.id,
            name: item.name,
            type: "bookmark",
          });
          setIsConfirmDeleteModalOpen(true);
        },
        icon: <Trash2 className="w-4 h-4" />,
        destructive: true,
      });
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      options,
    });
  };

  const handleCreateItem = async () => {
    const currentFolder = getCurrentFolder();

    try {
      if (createMode === "bookmark") {
        const newBookmark = await chrome.bookmarks.create({
          parentId: currentFolder.id,
          title: newItemData.title,
          url: newItemData.url,
        });
        console.log("Created bookmark:", newBookmark);
      } else if (createMode === "folder") {
        const newFolder = await chrome.bookmarks.create({
          parentId: currentFolder.id,
          title: newItemData.title,
        });
        console.log("Created folder:", newFolder);
      }

      // Refresh bookmarks
      chrome.bookmarks.getTree((tree) => {
        const transformedData = transformBrowserBookmarks(tree);
        setBookmarkData(transformedData);
      });

      setIsCreateModalOpen(false);
      setNewItemData({ title: "", url: "" });
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
    <div onContextMenu={handleContextMenu} className="flex flex-col h-full min-h-0">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-[#ccd6f6]">Loading bookmarks...</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col gap-2 mb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-6 h-6 text-[#bd93f9]" />
                <h2 className="text-xl font-bold text-[#ccd6f6]">
                  Stellar Bookmarks
                </h2>
              </div>
              <button
                onClick={() => {
                  setCreateMode("bookmark");
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center space-x-2 px-3 py-1 rounded-md bg-[#bd93f9]/20 text-[#bd93f9] hover:bg-[#bd93f9]/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            {/* Search Input */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Search bookmarks or folders..."
                className="w-full px-3 py-2 bg-[#283c5f] text-[#ccd6f6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#bd93f9] placeholder:text-[#7b8bbd]"
                autoComplete="off"
              />
              {/* Search Results Dropdown */}
              {showDropdown && searchQuery && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-[#1a2942] border border-[#283c5f] rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                  {searchResults.map((item, idx) => (
                    <button
                      key={item.id}
                      className="w-full flex items-center px-3 py-2 text-left hover:bg-[#bd93f9]/20 text-[#ccd6f6] space-x-2"
                      onMouseDown={e => {
                        e.preventDefault();
                        if (item.type === "bookmark") {
                          window.open(item.url, "_blank");
                        } else if (item.type === "folder") {
                          // Find the path to this folder and navigate
                          // item.path is an array of folder names leading to this folder
                          // item.name is the folder name
                          // Find the path in the data structure
                          if (bookmarkData) {
                            // Find the path as array of keys for setCurrentPath
                            let pathArr = ["root"];
                            let current = bookmarkData.root;
                            for (const folderName of item.path) {
                              const found = Object.entries(current.children || {}).find(([k, v]) => v.name === folderName && v.type === "folder");
                              if (found) {
                                pathArr.push(found[0]);
                                current = found[1];
                              }
                            }
                            // Now add the current folder
                            const found = Object.entries(current.children || {}).find(([k, v]) => v.name === item.name && v.type === "folder");
                            if (found) {
                              pathArr.push(found[0]);
                            }
                            setCurrentPath(pathArr);
                          }
                        }
                        setSearchQuery("");
                        setShowDropdown(false);
                      }}
                    >
                      {item.type === "bookmark" ? (
                        <Star className="w-4 h-4 text-[#bd93f9] flex-shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-[#bd93f9] flex-shrink-0" />
                      )}
                      <span className="truncate">{item.name}</span>
                      {item.type === "bookmark" && (
                        <span className="ml-2 text-xs text-[#7b8bbd] truncate">{item.url}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Path Navigation */}
          <div
            className="flex items-center space-x-2 mb-2 bg-[#1a2942] p-2 rounded-md overflow-x-auto flex-shrink-0"
            onDragOver={handleDragOver}
            style={{ minHeight: '40px' }}
          >
            {pathNames.map((item, index) => (
              <React.Fragment key={item.id}>
                <div
                  onDrop={(e) => handleDropOnNavigation(e, index)}
                  onDragOver={handleDragOver}
                  className="flex items-center"
                >
                  <button
                    onClick={() => navigateTo(index)}
                    className="text-[#ccd6f6] hover:text-[#bd93f9] transition-colors duration-300 whitespace-nowrap"
                  >
                    {item.name}
                  </button>
                  {index < pathNames.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-[#bd93f9] flex-shrink-0" />
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Content Area */}
          <div className="scroll-container flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {/* Folders - Now draggable and droppable */}
              {Object.entries(currentFolder?.children || {})
                .filter(([_, item]) => item.type === "folder")
                .map(([name, folder]) => (
                  <div
                    key={folder.id}
                    className="relative group"
                    onContextMenu={(e) =>
                      handleContextMenu(e, { ...folder, name })
                    }
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnFolder(e, folder)}
                  >
                    <button
                      draggable
                      onDragStart={(e) => handleDragStart(e, folder, "folder")}
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

              {/* Bookmarks - Now draggable */}
              {Object.entries(currentFolder?.children || {})
                .filter(([_, item]) => item.type === "bookmark")
                .map(([_, bookmark]) => (
                  <div
                    key={bookmark.id}
                    className="relative group"
                    onContextMenu={(e) => handleContextMenu(e, bookmark)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnFolder(e, currentFolder)}
                  >
                    <a
                      href={bookmark.url}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, bookmark, "bookmark")
                      }
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

          <ConfirmDeleteModal
            isOpen={isConfirmDeleteModalOpen}
            onClose={() => {
              setIsConfirmDeleteModalOpen(false);
              setDeleteItem(null);
            }}
            onConfirm={handleDeleteItem}
            itemName={deleteItem?.name}
            itemType={deleteItem?.type}
          />

          {/* Context Menu */}
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              options={contextMenu.options}
              onClose={() => setContextMenu(null)}
            />
          )}

          {/* Create Modal */}
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setNewItemData({ title: "", url: "" });
            }}
          >
            <h3 className="text-lg font-semibold text-[#ccd6f6] mb-4">
              Create New {createMode === "folder" ? "Folder" : "Bookmark"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#ccd6f6] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newItemData.title}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#283c5f] text-[#ccd6f6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#bd93f9]"
                />
              </div>
              {createMode === "bookmark" && (
                <div>
                  <label className="block text-sm text-[#ccd6f6] mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={newItemData.url}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, url: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#283c5f] text-[#ccd6f6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#bd93f9]"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewItemData({ title: "", url: "" });
                  }}
                  className="px-4 py-2 text-[#ccd6f6] hover:text-[#bd93f9]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateItem}
                  className="px-4 py-2 bg-[#bd93f9] text-white rounded-md hover:bg-[#bd93f9]/90"
                >
                  Create
                </button>
              </div>
            </div>
          </Modal>

          {/* Tooltip Portal */}
          {activeTooltip && (
            <Tooltip target={activeTooltip.ref}>{activeTooltip.name}</Tooltip>
          )}
        </>
      )}
    </div>
  );
};

export default BookMarks;
