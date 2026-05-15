import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { orderAPI } from "../services/api";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./Reader.css";

// Use the bundled worker from react-pdf v9
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const API_BASE = "http://localhost:5001/api";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : "—";

const initials = (title) =>
  title ? title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() : "?";

export default function Reader() {
  const { readToken } = useParams();
  const navigate = useNavigate();

  const [status, setStatus]         = useState("checking");
  const [access, setAccess]         = useState(null);
  const [book, setBook]             = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [message, setMessage]       = useState("");

  // PDF page state
  const [numPages, setNumPages]       = useState(null);
  const [pageNumber, setPageNumber]   = useState(1);
  const [bookId, setBookId]           = useState(null);
  const [pageWidth, setPageWidth]     = useState(800);
  const containerRef                  = useRef(null);
  const pdfPageRef                    = useRef(null); // ref for highlight overlay anchor
  const [pdfPageRect, setPdfPageRect] = useState(null); // tracks .react-pdf__Page rect

  // Zoom / font adjustment state
  const [scale, setScale] = useState(1.0);
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 2.5;
  const zoomIn  = () => setScale(s => Math.min(MAX_SCALE, Math.round((s + 0.2) * 10) / 10));
  const zoomOut = () => setScale(s => Math.max(MIN_SCALE, Math.round((s - 0.2) * 10) / 10));

  // Bookmark state
  const [bookmarks, setBookmarks]         = useState([]); // [{ page_number }]
  const [bookmarkMsg, setBookmarkMsg]     = useState("");
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Notes state
  const [notes, setNotes]           = useState([]);
  const [showNotes, setShowNotes]   = useState(false);
  const [noteText, setNoteText]     = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteMsg, setNoteMsg]       = useState("");

  // Highlights state
  const [highlights, setHighlights]         = useState([]);
  const [showHighlights, setShowHighlights] = useState(false);
  const [highlightMsg, setHighlightMsg]     = useState("");
  const [highlightBtnActive, setHighlightBtnActive] = useState(false); // true when text is selected

  // Toast notification
  const [toast, setToast] = useState(null); // { msg, type: "success"|"warn" }
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const token = localStorage.getItem("token") || localStorage.getItem("authToken");

  // Measure container width for responsive PDF rendering
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setPageWidth(Math.min(containerRef.current.clientWidth - 32, 900));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [status]);

  // Track text selection to enable/disable highlight button
  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection().toString().trim();
      setHighlightBtnActive(sel.length > 0);
    };
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, []);

  // Save progress to backend
  const saveProgress = useCallback((bId, page) => {
    if (!bId || !page || !token) return;
    fetch(`${API_BASE}/readers/reading-progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bookId: bId, page })
    }).catch(() => {});
  }, [token]);

  // Load saved progress from backend
  const loadProgress = useCallback(async (bId) => {
    try {
      const res = await fetch(`${API_BASE}/readers/reading-progress/${bId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      return res.success ? (res.page || 1) : 1;
    } catch {
      return 1;
    }
  }, [token]);

  // Load bookmarks
  const loadBookmarks = useCallback(async (bId) => {
    try {
      const res = await fetch(`${API_BASE}/readers/bookmarks/${bId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      if (res.success) setBookmarks(res.bookmarks || []);
    } catch { /* non-critical */ }
  }, [token]);

  // Load notes
  const loadNotes = useCallback(async (bId) => {
    try {
      const res = await fetch(`${API_BASE}/readers/notes/${bId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      if (res.success) setNotes(res.notes || []);
    } catch { /* non-critical */ }
  }, [token]);

  // Save note for current page
  const saveNote = async () => {
    if (!noteText.trim() || !bookId) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${API_BASE}/readers/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ book_id: bookId, page_number: pageNumber, note_text: noteText.trim() })
      }).then(r => r.json());
      if (res.success) {
        setNotes(prev => [{ note_id: res.note_id, page_number: pageNumber, note_text: noteText.trim(), created_at: new Date().toISOString() }, ...prev]);
        setNoteText("");
        showToast("Note saved!");
      }
    } catch { /* non-critical */ }
    setSavingNote(false);
  };

  // Delete note
  const deleteNote = async (noteId) => {
    try {
      await fetch(`${API_BASE}/readers/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => prev.filter(n => n.note_id !== noteId));
    } catch { /* non-critical */ }
  };

  // Load highlights
  const loadHighlights = useCallback(async (bId) => {
    try {
      const res = await fetch(`${API_BASE}/readers/highlights/${bId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      if (res.success) setHighlights(res.highlights || []);
    } catch { /* non-critical */ }
  }, [token]);

  // Save highlight using selection coordinates (works for Nepali text)
  const saveHighlight = async () => {
    const sel = window.getSelection();
    const text = sel?.toString()
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width chars
      .replace(/\s+/g, " ");                  // collapse whitespace
    if (!text) {
      showToast("Select some text from the PDF first.", "warn");
      return;
    }
    if (!bookId) return;

    // Duplicate check — same text on same page already highlighted
    const isDuplicate = highlights.some(
      h => h.page_number === pageNumber && h.selected_text.trim() === text
    );
    if (isDuplicate) {
      showToast("Already highlighted on this page.", "warn");
      window.getSelection().removeAllRanges();
      setHighlightBtnActive(false);
      return;
    }

    // Use .react-pdf__Page as the reference — it exactly wraps the canvas
    const reactPdfPage = document.querySelector(".react-pdf__Page");
    const pageContainer = reactPdfPage || pdfPageRef.current;
    if (!pageContainer) {
      showToast("PDF page not ready. Try again.", "warn");
      return;
    }
    const containerRect = pageContainer.getBoundingClientRect();

    // Collect all client rects from the selection range
    const range = sel.getRangeAt(0);
    const clientRects = Array.from(range.getClientRects());

    // Convert to percentage relative to the pdfPageRef element
    const rects = clientRects
      .filter(r => r.width > 1 && r.height > 1)
      .map(r => ({
        x: ((r.left - containerRect.left) / containerRect.width) * 100,
        y: ((r.top  - containerRect.top)  / containerRect.height) * 100,
        w: (r.width  / containerRect.width) * 100,
        h: (r.height / containerRect.height) * 100,
      }))
      .filter(r => r.x > -5 && r.y > -5 && r.x < 105 && r.y < 105);

    if (rects.length === 0) {
      showToast("Could not capture selection position.", "warn");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/readers/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          book_id: bookId,
          page_number: pageNumber,
          selected_text: text,
          rects,
          color: "yellow"
        })
      }).then(r => r.json());

      if (res.success) {
        setHighlights(prev => [{
          highlight_id: res.highlight_id,
          page_number: pageNumber,
          selected_text: text,
          rects,
          color: "yellow",
          created_at: new Date().toISOString()
        }, ...prev]);
        sel.removeAllRanges();
        setHighlightBtnActive(false);
        showToast("Text highlighted and saved!");
      }
    } catch { /* non-critical */ }
  };

  // Delete highlight
  const deleteHighlight = async (highlightId) => {
    try {
      await fetch(`${API_BASE}/readers/highlights/${highlightId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setHighlights(prev => prev.filter(h => h.highlight_id !== highlightId));
    } catch { /* non-critical */ }
  };

  // Toggle bookmark for current page
  const toggleBookmark = async () => {
    if (!bookId) return;
    const isBookmarked = bookmarks.some(b => b.page_number === pageNumber);
    if (isBookmarked) {
      await fetch(`${API_BASE}/readers/bookmarks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ book_id: bookId, page_number: pageNumber })
      }).catch(() => {});
      setBookmarks(prev => prev.filter(b => b.page_number !== pageNumber));
      showToast("Bookmark removed");
    } else {
      await fetch(`${API_BASE}/readers/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ book_id: bookId, page_number: pageNumber })
      }).catch(() => {});
      setBookmarks(prev => [...prev, { page_number: pageNumber }].sort((a, b) => a.page_number - b.page_number));
      showToast("Page bookmarked!");
    }
    setTimeout(() => setBookmarkMsg(""), 2000);
  };

  // Resolve token and load PDF
  useEffect(() => {
    if (!readToken || !readToken.startsWith("read_")) {
      setMessage("Invalid or missing read token.");
      setStatus("denied");
      return;
    }

    orderAPI.resolveReadToken(readToken)
      .then(async (res) => {
        if (!res.success) {
          setMessage(res.message || "Access denied.");
          setStatus("denied");
          return;
        }

        setAccess(res);
        setBook({ title: res.bookTitle, author: res.authorName || null });
        setBookId(res.bookId);

        if (res.pdfReadUrl) {
          setPdfLoading(true);
          try {
            const pdfRes = await fetch(res.pdfReadUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!pdfRes.ok) throw new Error("PDF fetch failed");
            const blob = await pdfRes.blob();
            setPdfBlobUrl(URL.createObjectURL(blob));

            // Load saved progress
            const savedPage = await loadProgress(res.bookId);
            setPageNumber(savedPage);

            // Load bookmarks
            await loadBookmarks(res.bookId);

            // Load notes
            await loadNotes(res.bookId);

            // Load highlights
            await loadHighlights(res.bookId);
          } catch (e) {
            console.error("PDF load error:", e);
          } finally {
            setPdfLoading(false);
          }
        }

        setStatus("granted");
      })
      .catch((err) => {
        const msg = err.message || "";
        if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("invalid")) {
          setMessage(msg || "Your reading session has expired. Please go back to My Library.");
          setStatus("denied");
        } else {
          setMessage(msg || "Failed to load book.");
          setStatus("error");
        }
      });

    return () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); };
  }, [readToken]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    // Capture .react-pdf__Page rect after it renders
    setTimeout(() => {
      const el = document.querySelector(".react-pdf__Page");
      if (el) setPdfPageRect(el.getBoundingClientRect());
    }, 300);
  };

  const goToPage = (newPage) => {
    if (!numPages || newPage < 1 || newPage > numPages) return;
    setPageNumber(newPage);
    saveProgress(bookId, newPage);
    // Re-capture page rect after new page renders
    setTimeout(() => {
      const el = document.querySelector(".react-pdf__Page");
      if (el) setPdfPageRect(el.getBoundingClientRect());
    }, 400);
  };

  const handleDownload = async () => {
    if (!access?.pdfDownloadUrl) return;
    try {
      const res = await fetch(access.pdfDownloadUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(book?.title || "book").replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Please try again.");
    }
  };

  // ── Checking ──────────────────────────────────────────────────────
  if (status === "checking") {
    return (
      <div className="reader-gate">
        <div className="reader-gate-spinner" />
        <p>Opening your book...</p>
      </div>
    );
  }

  // ── Denied ────────────────────────────────────────────────────────
  if (status === "denied") {
    return (
      <div className="reader-gate">
        <div className="reader-gate-icon">🔒</div>
        <h2>Access Required</h2>
        <p>{message}</p>
        <div className="reader-gate-actions">
          <Link to="/my-library" className="reader-gate-btn">My Library</Link>
          <Link to="/browse" className="reader-gate-btn reader-gate-btn-outline">Browse Books</Link>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="reader-gate">
        <div className="reader-gate-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>{message}</p>
        <div className="reader-gate-actions">
          <button className="reader-gate-btn" onClick={() => window.location.reload()}>Try Again</button>
          <Link to="/my-library" className="reader-gate-btn reader-gate-btn-outline">My Library</Link>
        </div>
      </div>
    );
  }

  // ── Access granted ────────────────────────────────────────────────
  const isRent = access?.accessType === "rent";
  const bookTitle = book?.title || access?.bookTitle || "Book";
  const bookAuthor = book?.author || null;

  return (
    <div className="reader-shell">

      {/* Top bar */}
      <header className="reader-topbar">
        <button className="reader-back" onClick={() => navigate("/my-library")}>
          ← Library
        </button>

        <div className="reader-book-meta">
          <span className="reader-book-title">{bookTitle}</span>
          {bookAuthor && <span className="reader-book-author">by {bookAuthor}</span>}
        </div>

        <div className="reader-topbar-right">
          {isRent ? (
            <span className="reader-access-badge reader-badge-rent">
              Rental · {access.remainingDays} day{access.remainingDays !== 1 ? "s" : ""} left
            </span>
          ) : (
            <span className="reader-access-badge reader-badge-owned">Owned</span>
          )}
          {/* {access?.canDownload && access?.pdfDownloadUrl && (
            <button className="reader-download-btn" onClick={handleDownload}>
              ↓ Download
            </button>
          )} */}
          {pdfBlobUrl && (
            <button
              className="reader-download-btn"
              onClick={() => setShowBookmarks(s => !s)}
              style={{ background: showBookmarks ? "#4f46e5" : "rgba(255,255,255,0.1)" }}
            >
              🔖 Bookmarks {bookmarks.length > 0 ? `(${bookmarks.length})` : ""}
            </button>
          )}
          {pdfBlobUrl && (
            <button
              className="reader-download-btn"
              onClick={() => setShowNotes(s => !s)}
              style={{ background: showNotes ? "#059669" : "rgba(255,255,255,0.1)" }}
            >
              📝 Notes {notes.length > 0 ? `(${notes.length})` : ""}
            </button>
          )}
          {pdfBlobUrl && (
            <button
              className="reader-download-btn"
              onClick={saveHighlight}
              style={{
                background: highlightBtnActive ? "#d97706" : "rgba(255,255,255,0.08)",
                opacity: highlightBtnActive ? 1 : 0.55,
                cursor: highlightBtnActive ? "pointer" : "default",
                border: highlightBtnActive ? "1px solid #f59e0b" : "1px solid transparent",
                transition: "all 0.2s"
              }}
              title={highlightBtnActive ? "Save highlight" : "Select text from the PDF first"}
            >
              ✏️ Highlight{highlightBtnActive ? " Selected" : ""}
            </button>
          )}
          {pdfBlobUrl && (
            <button
              className="reader-download-btn"
              onClick={() => setShowHighlights(s => !s)}
              style={{ background: showHighlights ? "#d97706" : "rgba(255,255,255,0.1)" }}
            >
              🌟 Highlights {highlights.length > 0 ? `(${highlights.length})` : ""}
            </button>
          )}
        </div>
      </header>

      {/* Reader body */}
      <main className="reader-body" ref={containerRef}>
        {pdfLoading ? (
          <div className="reader-pdf-loading">
            <div className="reader-gate-spinner" />
            <p>Loading PDF...</p>
          </div>
        ) : pdfBlobUrl ? (
          <div className="reader-pdf-container">
            {/* Bookmark panel */}
            {showBookmarks && (
              <div className="reader-bookmark-panel">
                <div className="reader-bookmark-header">
                  <span>🔖 Bookmarks</span>
                  <button onClick={() => setShowBookmarks(false)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
                {bookmarks.length === 0 ? (
                  <p style={{ color: "#888", fontSize: 13, padding: "8px 0" }}>No bookmarks yet. Click "Bookmark" while reading to save a page.</p>
                ) : (
                  <div className="reader-bookmark-list">
                    {bookmarks.map(b => (
                      <button
                        key={b.page_number}
                        className="reader-bookmark-item"
                        onClick={() => { goToPage(b.page_number); setShowBookmarks(false); }}
                      >
                        📄 Page {b.page_number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes panel */}
            {showNotes && (
              <div className="reader-notes-panel">
                <div className="reader-bookmark-header">
                  <span>📝 Notes</span>
                  <button onClick={() => setShowNotes(false)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>

                {/* Add note for current page */}
                <div className="reader-note-add">
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 6px" }}>Add note for Page {pageNumber}</p>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Write your note here..."
                    rows={3}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.06)", color: "#e2e8f0", fontSize: 13, resize: "vertical",
                      outline: "none", boxSizing: "border-box", fontFamily: "inherit"
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                    <button
                      onClick={saveNote}
                      disabled={savingNote || !noteText.trim()}
                      style={{
                        padding: "6px 18px", borderRadius: 6, border: "none",
                        background: noteText.trim() ? "#059669" : "#333",
                        color: "#fff", fontWeight: 700, fontSize: 13, cursor: noteText.trim() ? "pointer" : "default"
                      }}
                    >
                      {savingNote ? "Saving..." : "Save Note"}
                    </button>
                    {noteMsg && <span style={{ color: "#86efac", fontSize: 12 }}>{noteMsg}</span>}
                  </div>
                </div>

                {/* Notes list */}
                {notes.length === 0 ? (
                  <p style={{ color: "#888", fontSize: 13, marginTop: 12 }}>No notes yet. Add your first note above.</p>
                ) : (
                  <div className="reader-notes-list">
                    {notes.map(n => (
                      <div key={n.note_id} className="reader-note-item">
                        <div className="reader-note-header">
                          <button
                            className="reader-note-page"
                            onClick={() => { goToPage(n.page_number); setShowNotes(false); }}
                          >
                            📄 Page {n.page_number}
                          </button>
                          <button
                            onClick={() => deleteNote(n.note_id)}
                            style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                          >
                            ✕
                          </button>
                        </div>
                        <p className="reader-note-text">{n.note_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Highlights panel */}
            {showHighlights && (
              <div className="reader-highlights-panel">
                <div className="reader-bookmark-header">
                  <span>🌟 Highlights</span>
                  <button onClick={() => setShowHighlights(false)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
                <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 10px" }}>
                  Select text from the PDF, then click <strong style={{ color: "#fbbf24" }}>✏️ Highlight Selected</strong> in the toolbar.
                </p>
                {highlights.length === 0 ? (
                  <p style={{ color: "#888", fontSize: 13 }}>No highlights yet.</p>
                ) : (
                  <div className="reader-highlights-list">
                    {highlights.map(h => (
                      <div key={h.highlight_id} className="reader-highlight-item">
                        <div className="reader-note-header">
                          <button
                            className="reader-highlight-page"
                            onClick={() => { goToPage(h.page_number); setShowHighlights(false); }}
                          >
                            📄 Page {h.page_number}
                          </button>
                          <button
                            onClick={() => deleteHighlight(h.highlight_id)}
                            style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                          >
                            ✕
                          </button>
                        </div>
                        <p className="reader-highlight-text">
                          "{(() => { const t = h.selected_text.trim().replace(/\s+/g, " "); return t.length > 60 ? t.slice(0, 60) + "..." : t; })()}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Page navigation — top */}
            <div className="reader-page-controls">
              <button
                className="reader-page-btn"
                onClick={() => goToPage(pageNumber - 1)}
                disabled={pageNumber <= 1}
              >
                ← Prev
              </button>

              <span className="reader-page-info">
                Page <strong>{pageNumber}</strong>
                {numPages ? <> of <strong>{numPages}</strong></> : null}
              </span>

              <button
                className="reader-page-btn"
                onClick={() => goToPage(pageNumber + 1)}
                disabled={numPages !== null && pageNumber >= numPages}
              >
                Next →
              </button>

              {/* Bookmark button */}
              <button
                className="reader-page-btn"
                onClick={toggleBookmark}
                style={{
                  background: bookmarks.some(b => b.page_number === pageNumber) ? "#f59e0b" : "rgba(255,255,255,0.1)",
                  marginLeft: 8
                }}
              >
                {bookmarks.some(b => b.page_number === pageNumber) ? "🔖 Bookmarked" : "🔖 Bookmark"}
              </button>

              {bookmarkMsg && <span style={{ color: "#86efac", fontSize: 13 }}>{bookmarkMsg}</span>}

              {/* Zoom controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                <button
                  className="reader-page-btn"
                  onClick={zoomOut}
                  disabled={scale <= MIN_SCALE}
                  style={{ padding: "6px 12px", fontSize: 16 }}
                  title="Zoom Out"
                >
                  ➖
                </button>
                <span style={{ color: "#ccc", fontSize: 13, minWidth: 44, textAlign: "center" }}>
                  {Math.round(scale * 100)}%
                </span>
                <button
                  className="reader-page-btn"
                  onClick={zoomIn}
                  disabled={scale >= MAX_SCALE}
                  style={{ padding: "6px 12px", fontSize: 16 }}
                  title="Zoom In"
                >
                  ➕
                </button>
              </div>
            </div>

            {/* PDF page rendered by react-pdf */}
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            {/* pdfPageRef wraps ONLY the Page — no padding, exact canvas size */}
            <div
              className="reader-pdf-page"
              ref={pdfPageRef}
              style={{ position: "relative", display: "inline-block", lineHeight: 0 }}
            >
              {/* Coordinate-based highlight overlays — only for highlights with valid rects */}
              {highlights
                .filter(h =>
                  h.page_number === pageNumber &&
                  Array.isArray(h.rects) &&
                  h.rects.length > 0 &&
                  h.rects.every(r => typeof r.x === "number" && typeof r.y === "number" && r.w > 0 && r.h > 0)
                )
                .map(h =>
                  h.rects.map((r, ri) => (
                    <div
                      key={`${h.highlight_id}-${ri}`}
                      style={{
                        position: "absolute",
                        left: `${r.x}%`,
                        top: `${r.y}%`,
                        width: `${r.w}%`,
                        height: `${r.h}%`,
                        background: "rgba(253, 221, 0, 0.35)",
                        pointerEvents: "none",
                        borderRadius: 2,
                        zIndex: 10,
                      }}
                    />
                  ))
                )
              }
              <Document
                file={pdfBlobUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={null}
                error={<div style={{ color: "#ef4444", padding: 24 }}>Failed to load PDF.</div>}
              >
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={<div style={{ width: pageWidth, minHeight: 600, background: "rgba(255,255,255,0.03)", borderRadius: 4 }} />}
                />
              </Document>
            </div>
            </div>{/* end centering wrapper */}

            {/* Page navigation — bottom */}
            <div className="reader-page-controls reader-page-controls-bottom">
              <button
                className="reader-page-btn"
                onClick={() => goToPage(pageNumber - 1)}
                disabled={pageNumber <= 1}
              >
                ← Prev
              </button>

              <span className="reader-page-info">
                Page <strong>{pageNumber}</strong>
                {numPages ? <> of <strong>{numPages}</strong></> : null}
              </span>

              <button
                className="reader-page-btn"
                onClick={() => goToPage(pageNumber + 1)}
                disabled={numPages !== null && pageNumber >= numPages}
              >
                Next →
              </button>
            </div>
          </div>
        ) : (
          <NoPdfPlaceholder
            bookTitle={bookTitle}
            bookAuthor={bookAuthor}
            access={access}
            isRent={isRent}
          />
        )}
      </main>

      {/* Toast notification */}
      {toast && (
        <div className={`reader-toast reader-toast-${toast.type}`}>
          {toast.type === "warn" ? "⚠️" : "✓"} {toast.msg}
        </div>
      )}

    </div>
  );
}

function NoPdfPlaceholder({ bookTitle, bookAuthor, access, isRent }) {
  return (
    <div className="reader-placeholder">
      <div className="reader-placeholder-cover">
        <span className="reader-placeholder-initials">{initials(bookTitle)}</span>
      </div>

      <div className="reader-placeholder-info">
        <h2>{bookTitle}</h2>
        {bookAuthor && <p className="reader-placeholder-author">by {bookAuthor}</p>}

        <div className="reader-placeholder-access">
          {isRent ? (
            <>
              <span className="rp-badge rp-badge-rent">Rental</span>
              <span className="rp-detail">
                {access.remainingDays} day{access.remainingDays !== 1 ? "s" : ""} remaining
                {access.rentExpiresAt && ` · expires ${fmtDate(access.rentExpiresAt)}`}
              </span>
            </>
          ) : (
            <>
              <span className="rp-badge rp-badge-owned">Purchased</span>
              <span className="rp-detail">Permanent access</span>
            </>
          )}
        </div>

        <div className="reader-placeholder-notice">
          <span className="rp-notice-icon">📖</span>
          <div>
            <p className="rp-notice-title">PDF not yet available</p>
            <p className="rp-notice-sub">
              Your access is confirmed. The PDF will appear here once the author uploads it.
            </p>
          </div>
        </div>

        <div className="reader-placeholder-actions">
          <Link to="/my-library" className="rp-btn-library">← Back to Library</Link>
        </div>
      </div>
    </div>
  );
}
