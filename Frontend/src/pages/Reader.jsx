import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./Reader.css";

const API_BASE = "http://localhost:5001/api";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : "—";

const initials = (title) =>
  title ? title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() : "?";

export default function Reader() {
  const { readToken } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");
  const [access, setAccess] = useState(null);
  const [book, setBook] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [message, setMessage] = useState("");

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

        // If backend has a real PDF, fetch it as a blob (so auth header is sent)
        if (res.pdfReadUrl) {
          setPdfLoading(true);
          const token = localStorage.getItem("token") || localStorage.getItem("authToken");
          try {
            const pdfRes = await fetch(res.pdfReadUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!pdfRes.ok) throw new Error("PDF fetch failed");
            const blob = await pdfRes.blob();
            setPdfBlobUrl(URL.createObjectURL(blob));
          } catch (e) {
            console.error("PDF load error:", e);
            // Don't block — just show placeholder
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

    // Cleanup blob URL on unmount
    return () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); };
  }, [readToken]);

  const handleDownload = async () => {
    if (!access?.pdfDownloadUrl) return;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    try {
      const res = await fetch(access.pdfDownloadUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(book?.title || access?.bookTitle || "book").replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Download failed. Please try again.");
    }
  };

  // ── Checking ─────────────────────────────────────────────────────
  if (status === "checking") {
    return (
      <div className="reader-gate">
        <div className="reader-gate-spinner" />
        <p>Opening your book...</p>
      </div>
    );
  }

  // ── Denied ───────────────────────────────────────────────────────
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
          {access?.canDownload && access?.pdfDownloadUrl && (
            <button className="reader-download-btn" onClick={handleDownload}>
              ↓ Download
            </button>
          )}
        </div>
      </header>

      {/* Reader body */}
      <main className="reader-body">
        {pdfLoading ? (
          <div className="reader-pdf-loading">
            <div className="reader-gate-spinner" />
            <p>Loading PDF...</p>
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            className="reader-iframe"
            src={`${pdfBlobUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
            title={bookTitle}
          />
        ) : (
          <NoPdfPlaceholder
            bookTitle={bookTitle}
            bookAuthor={bookAuthor}
            access={access}
            isRent={isRent}
          />
        )}
      </main>

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
