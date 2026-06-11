import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type ViewState = "loading" | "counting" | "complete";

export default function DownloadPage() {
  const [view, setView] = useState<ViewState>("loading");
  const [countingNumber, setCountingNumber] = useState(0);
  const [finalCount, setFinalCount] = useState(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const countingIntervalRef = useRef<number | null>(null);

  const clearCounting = useCallback(() => {
    if (countingIntervalRef.current !== null) {
      clearInterval(countingIntervalRef.current);
      countingIntervalRef.current = null;
    }
  }, []);

  const startCountingAnimation = useCallback(
    (target: number) => {
      clearCounting();
      let current = 0;
      const increment = Math.max(1, Math.ceil(target / 30));
      countingIntervalRef.current = window.setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearCounting();
        }
        setCountingNumber(current);
      }, 2000 / 30);
    },
    [clearCounting],
  );

  const animateFinalCount = useCallback((target: number) => {
    let current = 0;
    const increment = Math.max(1, Math.ceil(target / 40));
    const interval = window.setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setFinalCount(current);
    }, 1500 / 40);
  }, []);

  const showDownloadButton = useCallback(
    (url: string, piiCount: number) => {
      clearCounting();
      setFileUrl(url);
      setView("complete");
      animateFinalCount(piiCount);
    },
    [animateFinalCount, clearCounting],
  );

  const showCounterLoading = useCallback(
    (count: number) => {
      setView("counting");
      startCountingAnimation(count);
    },
    [startCountingAnimation],
  );

  const handleComplete = useCallback(
    (url: string, piiCount: number) => {
      sessionStorage.removeItem("pendingUpload");
      if (piiCount > 0) {
        showCounterLoading(piiCount);
        window.setTimeout(() => showDownloadButton(url, piiCount), 2000);
      } else {
        setView("loading");
        window.setTimeout(() => showDownloadButton(url, 0), 1500);
      }
    },
    [showCounterLoading, showDownloadButton],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let url = params.get("file");
    let count = params.get("count");
    const pendingUpload = localStorage.getItem("pendingUpload");

    if (url) url = decodeURIComponent(url);
    if (!url) url = localStorage.getItem("redactedFileUrl");
    if (!count) count = localStorage.getItem("piiCount");

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "redactionComplete" && event.data.fileUrl) {
        localStorage.setItem("redactedFileUrl", event.data.fileUrl);
        if (event.data.piiCount !== undefined) {
          localStorage.setItem("piiCount", String(event.data.piiCount));
        }
        localStorage.removeItem("pendingUpload");
        localStorage.removeItem("uploadError");
        handleComplete(event.data.fileUrl, event.data.piiCount ?? 0);
      }
      if (event.data?.type === "redactionError" && event.data.message) {
        alert(`Upload failed: ${event.data.message}`);
        localStorage.setItem("uploadError", event.data.message);
        localStorage.removeItem("pendingUpload");
        setView("loading");
      }
    };

    window.addEventListener("message", onMessage);

    if (pendingUpload !== "true" && url) {
      const parsedCount = count ? parseInt(count, 10) : 0;
      if (parsedCount > 0) {
        showCounterLoading(Math.max(parsedCount, 5));
        window.setTimeout(
          () => showDownloadButton(url!, parsedCount),
          2500,
        );
      } else {
        showCounterLoading(10);
        window.setTimeout(() => showDownloadButton(url!, 0), 2000);
      }
      return () => {
        window.removeEventListener("message", onMessage);
        clearCounting();
      };
    }

    if (pendingUpload === "true" || !url) {
      setView("loading");

      const checkInterval = window.setInterval(() => {
        const uploadError = localStorage.getItem("uploadError");
        if (uploadError) {
          clearInterval(checkInterval);
          alert(`Upload failed: ${uploadError}`);
          localStorage.removeItem("uploadError");
          localStorage.removeItem("pendingUpload");
          setView("loading");
          return;
        }

        const resolvedUrl = localStorage.getItem("redactedFileUrl");
        const resolvedCount = localStorage.getItem("piiCount");
        if (resolvedUrl) {
          clearInterval(checkInterval);
          handleComplete(
            resolvedUrl,
            resolvedCount ? parseInt(resolvedCount, 10) : 0,
          );
        }
      }, 500);

      const timeout = window.setTimeout(() => clearInterval(checkInterval), 300000);

      return () => {
        window.removeEventListener("message", onMessage);
        clearInterval(checkInterval);
        clearTimeout(timeout);
        clearCounting();
      };
    }

    return () => {
      window.removeEventListener("message", onMessage);
      clearCounting();
    };
  }, [
    clearCounting,
    handleComplete,
    showCounterLoading,
    showDownloadButton,
  ]);

  const downloadFileName = fileUrl?.split("/").pop() ?? "redacted.docx";

  return (
    <>
      <header style={{ display: "flex", flexDirection: "row", height: 80 }}>
        <img
          style={{ width: 180, marginLeft: 30 }}
          src="/img/logo.png"
          alt="Hide.Ai"
        />
        <div style={{ flex: 1, marginLeft: 780 }} className="header">
          <nav>
            <Link to="/">Home</Link>
          </nav>
        </div>
      </header>

      <div className="download">
        <div className="loading_side">
          {view !== "complete" && (
            <div className="loading_content" id="loading-content">
              <div className="loader-container">
                <span className="loader">Redacting</span>
                <span className="doc-loader" />
              </div>
            </div>
          )}
          {view === "complete" && fileUrl && (
            <div
              className="download-content"
              id="download-content"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                textAlign: "center",
                width: "100%",
              }}
            >
              <h2 style={{ marginBottom: 20, color: "#000" }}>
                Redaction Complete!
              </h2>
              <p style={{ marginBottom: 30, color: "#666" }}>
                Your document has been successfully redacted.
              </p>
              <a
                href={fileUrl}
                download={downloadFileName}
                className="download-button"
                id="download-btn"
              >
                <i className="fa-solid fa-download" /> Download Redacted
                Document
              </a>
            </div>
          )}
        </div>

        <div className="pii_numbers_side">
          {view === "loading" && (
            <div className="pii-counter-default" style={{ display: "flex" }}>
              <div className="counter-icon">
                <i className="fa-solid fa-file-lines" />
              </div>
              <div className="counter-text">Counting Redacted PII Values..</div>
            </div>
          )}

          {view === "counting" && (
            <div className="pii-counter-loading" style={{ display: "flex" }}>
              <div className="counter-icon">
                <i className="fa-solid fa-shield-halved" />
              </div>
              <div className="counter-text">Scanning for PII...</div>
              <div className="counter-number" id="counting-number">
                {countingNumber}
              </div>
              <div className="counter-label">values detected</div>
            </div>
          )}

          {view === "complete" && (
            <div className="pii-counter-complete" style={{ display: "flex" }}>
              <div className="counter-icon-complete">
                <i className="fa-solid fa-circle-check" />
              </div>
              <div className="counter-number-final" id="final-count">
                {finalCount.toLocaleString()}
              </div>
              <div className="counter-label-final">PII Values Redacted</div>
              <div className="counter-message">Your document is now secure</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
