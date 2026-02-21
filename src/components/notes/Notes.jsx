import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import { StickyNote, Plus, X, Trash2, Pencil, Search, GripVertical } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_CHROME_HOME_SERVER_URL || "https://chrome-home-server.vercel.app/api";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#1a2942] rounded-lg p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#ccd6f6] hover:text-[#50fa7b] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </motion.div>
    </motion.div>,
    document.body
  );
};

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a2942] rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#ccd6f6] mb-4">
          Confirm Delete
        </h3>
        <p className="text-[#ccd6f6] mb-6">
          Are you sure you want to delete &quot;{itemName}&quot;?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#ccd6f6] hover:text-[#50fa7b] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

function LinkifyText({ text, className }) {
  if (!text) return null;
  const parts = text.split(URL_REGEX);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#50fa7b] hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </span>
  );
}

const Notes = () => {
  const [userEmail, setUserEmail] = useState(null);
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [draggedNoteId, setDraggedNoteId] = useState(null);
  const [reorderSaving, setReorderSaving] = useState(false);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.trim().toLowerCase();
    return notes.filter(
      (n) =>
        (n.title || "").toLowerCase().includes(q) ||
        (n.content || "").toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  const headersWithUser = () => ({
    "Content-Type": "application/json",
    ...(userEmail && { "X-User-Email": userEmail }),
  });

  const NOTES_LIMIT = 10;

  const fetchNotes = async (page = 1, append = false) => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }
    try {
      if (!append) setIsLoading(true);
      const response = await fetch(`${API_BASE}/notes?page=${page}&limit=${NOTES_LIMIT}`, {
        method: "GET",
        credentials: "include",
        headers: headersWithUser(),
      });
      if (!response.ok) throw new Error("Failed to fetch notes");
      const data = await response.json();
      const list = data.notes ?? data;
      const hasMore = data.hasMore ?? false;
      if (append) {
        setNotes((prev) => [...prev, ...list]);
      } else {
        setNotes(list);
      }
      setHasMore(hasMore);
      setNextPage(data.nextPage ?? (hasMore ? page + 1 : null));
      setError(null);
    } catch (err) {
      setError(err.message);
      if (!append) setNotes([]);
    } finally {
      setIsLoading(false);
      setLoadMoreLoading(false);
    }
  };

  useEffect(() => {
    const getUserIdentity = async () => {
      try {
        if (typeof chrome !== "undefined" && chrome.identity && chrome.identity.getProfileUserInfo) {
          const info = await new Promise((resolve) => {
            chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, resolve);
          });
          const email = info?.email || null;
          const id = info?.id || null;
          setUserEmail(email || (id ? `id:${id}` : null));
        } else {
          setUserEmail(null);
        }
      } catch {
        setUserEmail(null);
      }
    };
    getUserIdentity();
  }, []);

  useEffect(() => {
    if (userEmail) fetchNotes(1, false);
    else setIsLoading(false);
  }, [userEmail]);

  const loadMore = () => {
    if (!nextPage || loadMoreLoading) return;
    setLoadMoreLoading(true);
    fetchNotes(nextPage, true);
  };

  const getOrderBetween = (prevOrder, nextOrder) => {
    if (prevOrder == null) return (nextOrder ?? 0) - 1;
    if (nextOrder == null) return (prevOrder ?? 0) + 1;
    if (prevOrder === nextOrder) return prevOrder - 0.0001;
    return (prevOrder + nextOrder) / 2;
  };

  const saveOrder = async (noteId, newOrder) => {
    if (!userEmail) return;
    setReorderSaving(true);
    try {
      const response = await fetch(`${API_BASE}/notes/reorder`, {
        method: "PUT",
        credentials: "include",
        headers: headersWithUser(),
        body: JSON.stringify({ noteId, newOrder }),
      });
      if (!response.ok) throw new Error("Failed to save order");
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, order: newOrder } : n))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setReorderSaving(false);
    }
  };

  const handleDragStart = (e, note) => {
    setDraggedNoteId(note._id);
    e.dataTransfer.setData("text/plain", note._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetNote) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    setDraggedNoteId(null);
    if (!sourceId || sourceId === targetNote._id) return;
    const sourceIndex = notes.findIndex((n) => n._id === sourceId);
    const targetIndex = notes.findIndex((n) => n._id === targetNote._id);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const next = [...notes];
    const [removed] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, removed);
    const prevOrder = targetIndex > 0 ? next[targetIndex - 1].order : null;
    const nextOrder = targetIndex < next.length - 1 ? next[targetIndex + 1].order : null;
    const newOrder = getOrderBetween(prevOrder, nextOrder);
    setNotes(next.map((n, i) => (i === targetIndex ? { ...n, order: newOrder } : n)));
    saveOrder(removed._id, newOrder);
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !userEmail) return;
    try {
      const response = await fetch(`${API_BASE}/notes`, {
        method: "POST",
        credentials: "include",
        headers: headersWithUser(),
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content || "",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) throw new Error(data.error || "Rate limit: max 100 notes per day.");
        throw new Error(data.error || "Failed to create note");
      }
      const newNote = data;
      setNotes((prev) => [newNote, ...prev]);
      setFormData({ title: "", content: "" });
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingNote || !formData.title.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/notes/${editingNote._id}`, {
        method: "PUT",
        credentials: "include",
        headers: headersWithUser(),
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content || "",
        }),
      });
      if (!response.ok) throw new Error("Failed to update note");
      const updated = await response.json();
      setNotes((prev) =>
        prev.map((n) => (n._id === updated._id ? updated : n))
      );
      setFormData({ title: "", content: "" });
      setEditingNote(null);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    try {
      const response = await fetch(`${API_BASE}/notes/${noteToDelete._id}`, {
        method: "DELETE",
        credentials: "include",
        headers: headersWithUser(),
      });
      if (!response.ok) throw new Error("Failed to delete note");
      setNotes((prev) => prev.filter((n) => n._id !== noteToDelete._id));
      setNoteToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content || "" });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setFormData({ title: "", content: "" });
    setIsModalOpen(true);
  };

  const openDeleteModal = (note) => {
    setNoteToDelete(note);
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-col gap-2 mb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StickyNote className="w-6 h-6 text-[#50fa7b]" />
            <h2 className="text-xl font-bold text-[#ccd6f6]">Notes</h2>
          </div>
          <div className="flex items-center gap-2">
            {reorderSaving && (
              <span className="text-xs text-[#50fa7b]">Saving order...</span>
            )}
            <button
              onClick={openCreateModal}
              disabled={!userEmail}
              className="flex items-center space-x-2 px-3 py-1 rounded-md bg-[#50fa7b]/20 text-[#50fa7b] hover:bg-[#50fa7b]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Add Note</span>
            </button>
          </div>
        </div>
        {userEmail && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7b8bbd]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3 py-2 bg-[#283c5f] text-[#ccd6f6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#50fa7b] placeholder:text-[#7b8bbd]"
              autoComplete="off"
            />
          </div>
        )}
      </div>

      <div className="scroll-container flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2">
        {!userEmail && !isLoading ? (
          <div className="text-[#8892b0] text-center py-8">
            Sign in to Chrome with your Google account to view and create notes.
          </div>
        ) : isLoading ? (
          <div className="text-[#50fa7b]">Loading notes...</div>
        ) : error ? (
          <div className="text-red-400">Error: {error}</div>
        ) : filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#8892b0] text-center py-8"
          >
            {searchQuery.trim()
              ? "No notes match your search."
              : "No notes yet. Click \"Add Note\" to create one."}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence initial={false} mode="popLayout">
              {filteredNotes.map((note) => (
                <motion.div
                  key={note._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  draggable={!searchQuery.trim()}
                  onDragStart={(e) => handleDragStart(e, note)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, note)}
                  onDragEnd={handleDragEnd}
                  className={`group relative flex flex-col w-full max-w-full bg-[#1a2942] rounded-lg p-4 border border-[#50fa7b]/30 hover:border-[#50fa7b]/60 hover:shadow-[#50fa7b]/10 hover:shadow-lg transition-all duration-300 cursor-default min-h-0 ${draggedNoteId === note._id ? "opacity-50" : ""}`}
                  style={{ maxHeight: "min(320px, 70vh)" }}
                >
                  {!searchQuery.trim() && (
                    <div
                      className="absolute left-2 top-4 cursor-grab active:cursor-grabbing text-[#7b8bbd] hover:text-[#50fa7b] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`cursor-pointer flex-1 min-h-0 flex flex-col overflow-hidden ${!searchQuery.trim() ? "pl-6" : ""}`}
                    onClick={() => openEditModal(note)}
                  >
                    <h3 className="font-semibold text-[#ccd6f6] truncate mb-1 flex-shrink-0">
                      {note.title}
                    </h3>
                    <div className="text-sm text-[#8892b0] overflow-y-auto flex-1 min-h-0 whitespace-pre-wrap break-words scroll-container pr-1">
                      <LinkifyText
                        text={note.content || "No content"}
                        className="inline"
                      />
                    </div>
                    <span className="text-xs text-[#7b8bbd] mt-2 block flex-shrink-0">
                      {formatDate(note.updatedAt || note.createdAt)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(note);
                      }}
                      className="p-1.5 rounded hover:bg-[#50fa7b]/20 text-[#50fa7b]"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(note);
                      }}
                      className="p-1.5 rounded hover:bg-red-500/20 text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        {userEmail && hasMore && notes.length > 0 && !searchQuery.trim() && (
          <div className="flex justify-center pt-4 pb-2">
            <button
              onClick={loadMore}
              disabled={loadMoreLoading}
              className="px-4 py-2 rounded-md bg-[#50fa7b]/20 text-[#50fa7b] hover:bg-[#50fa7b]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadMoreLoading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setNoteToDelete(null);
          }}
          onConfirm={handleDelete}
          itemName={noteToDelete?.title || ""}
        />
      </div>

      {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingNote(null);
              setFormData({ title: "", content: "" });
            }}
          >
            <h3 className="text-lg font-semibold text-[#ccd6f6] mb-4">
              {editingNote ? "Edit Note" : "New Note"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#ccd6f6] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Note title"
                  className="w-full px-3 py-2 bg-[#283c5f] text-[#ccd6f6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#50fa7b] placeholder:text-[#7b8bbd]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#ccd6f6] mb-1">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Note content..."
                  rows={4}
                  className="w-full px-3 py-2 bg-[#283c5f] text-[#ccd6f6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#50fa7b] placeholder:text-[#7b8bbd] resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingNote(null);
                    setFormData({ title: "", content: "" });
                  }}
                  className="px-4 py-2 text-[#ccd6f6] hover:text-[#50fa7b] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingNote ? handleUpdate : handleCreate}
                  className="px-4 py-2 bg-[#50fa7b] text-[#0a192f] rounded-md hover:bg-[#50fa7b]/90 transition-colors font-medium"
                >
                  {editingNote ? "Save" : "Create"}
                </button>
              </div>
            </div>
          </Modal>
        )}
    </div>
  );
};

export default Notes;
