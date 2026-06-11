import mammoth from "mammoth";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { fetchDemoDoc, uploadDocument } from "../lib/api";
import { getAuthUser } from "../lib/storage";

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function useDemoLoader(
  demoParam: string | null,
  setFile: (file: File | null) => void,
) {
  useEffect(() => {
    if (!demoParam) return;

    const load = async () => {
      try {
        const { blob, name } = await fetchDemoDoc();
        setFile(
          new File([blob], name, {
            type: DOCX_TYPE,
          }),
        );
      } catch {
        /* demo load failed */
      }
    };

    void load();
  }, [demoParam, setFile]);
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const params = new URLSearchParams(window.location.search);
  const demoParam = params.get("demo");

  useDemoLoader(
    demoParam === "local" || demoParam === "true" ? demoParam : null,
    setFile,
  );

  useEffect(() => {
    if (file || demoParam) return;

    const user = getAuthUser();
    if (!user?.demo) return;

    void fetchDemoDoc()
      .then(({ blob, name }) => {
        setFile(new File([blob], name, { type: DOCX_TYPE }));
      })
      .catch(() => {
        /* backend unreachable */
      });
  }, [file, demoParam]);

  const setPreview = useCallback((f: File | null) => {
    setFile(f);
  }, []);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      setPreview(e.dataTransfer.files[0]);
    }
  };

  const onRedact = async () => {
    if (!file) {
      alert("Please select a .doc or .docx file.");
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (![".doc", ".docx"].includes(ext)) {
      alert("Only .doc or .docx files are allowed.");
      return;
    }

    sessionStorage.setItem("pendingUpload", "true");
    localStorage.setItem("pendingUpload", "true");
    sessionStorage.setItem("uploadFileName", file.name);
    sessionStorage.setItem("uploadTimestamp", Date.now().toString());
    localStorage.removeItem("redactedFileUrl");
    localStorage.removeItem("piiCount");
    localStorage.removeItem("uploadError");

    const downloadWin = window.open("/download", "_blank");

    void (async () => {
      try {
        const { fileUrl, piiCount } = await uploadDocument(file);
        localStorage.setItem("redactedFileUrl", fileUrl);
        localStorage.setItem("piiCount", piiCount.toString());
        localStorage.setItem(
          "uploadSessionId",
          sessionStorage.getItem("uploadTimestamp") ?? Date.now().toString(),
        );
        sessionStorage.removeItem("pendingUpload");
        sessionStorage.removeItem("uploadError");
        localStorage.removeItem("pendingUpload");
        localStorage.removeItem("uploadError");

        try {
          downloadWin?.postMessage(
            { type: "redactionComplete", fileUrl, piiCount },
            "*",
          );
        } catch {
          /* ignore */
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload/redact";
        localStorage.setItem("uploadError", message);
        try {
          downloadWin?.postMessage(
            { type: "redactionError", message },
            "*",
          );
        } catch {
          /* ignore */
        }
        sessionStorage.setItem("uploadError", message);
        sessionStorage.removeItem("pendingUpload");
        localStorage.removeItem("pendingUpload");
      }
    })();
  };

  const renderPreview = async () => {
    if (!file) {
      alert("Please select a document first.");
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    setPreviewOpen(true);
    setPreviewLoading(true);

    if (ext !== ".docx") {
      setPreviewHtml(
        "<p style='color:#b00020;'><b>Preview is available for .docx only.</b> You can still redact .doc files.</p>",
      );
      setPreviewLoading(false);
      return;
    }

    try {
      const ab = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer: ab });
      setPreviewHtml(
        `<div style="line-height:1.55;">${result.value || "<p>(No preview content)</p>"}</div>`,
      );
    } catch (err) {
      setPreviewHtml(
        `<p style="color:#b00020;"><b>Failed to render preview.</b> ${err instanceof Error ? err.message : String(err)}</p>`,
      );
    } finally {
      setPreviewLoading(false);
    }
  };

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
            <ul style={{ display: "flex", flexDirection: "row", gap: 20 }}>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <a href="#">Pricing</a>
              </li>
              <li>
                <a href="#">Result</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="drop-box" id="drop-box">
        <label
          htmlFor="input-file"
          id="drop-area"
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".doc,.docx"
            id="input-file"
            hidden
            onChange={(e) => setPreview(e.target.files?.[0] ?? null)}
          />
          <div
            className="img-view"
            id="img-view"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            {file ? (
              <>
                <p>{file.name}</p>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </>
            ) : (
              <>
                <img src="/img/drag.png" alt="" />
                <p>
                  Drag and Drop or Click here <br />
                  to upload doc
                </p>
                <span>Upload any .doc/.docx up to 5MB</span>
              </>
            )}
          </div>
        </label>
      </div>

      <div className="redact-container">
        <button
          type="button"
          className="Redact"
          style={{ marginRight: 12 }}
          onClick={renderPreview}
        >
          Preview
        </button>
        <button type="button" className="Redact" onClick={onRedact}>
          Redact your Pii value
        </button>
      </div>

      {previewOpen && (
        <div
          style={{
            display: "flex",
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            zIndex: 9999,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              maxWidth: 1000,
              width: "100%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid #e8e8e8",
              }}
            >
              <div style={{ fontWeight: 700 }}>Document preview</div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{ padding: 16, overflow: "auto" }}
              dangerouslySetInnerHTML={{
                __html: previewLoading
                  ? "<p style='color:#444;'>Loading preview…</p>"
                  : previewHtml,
              }}
            />
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #e8e8e8",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                className="Redact"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
