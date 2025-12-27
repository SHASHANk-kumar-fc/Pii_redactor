import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os

# 🔁 MODIFIED: added `build_buffer`
from pii_detect.services.replace_pii_values import convert_pii_in_docx_span, build_buffer
from pii_detect.services.divide_the_content   import split_text_into_chunks
from pii_detect.services.communicate_with_llm import detect_pii_from_chunks
from pii_detect.services.text_conversion import extract_text_from_docx

from difflib import SequenceMatcher  #  ADDED

router = APIRouter()
ALLOWED_EXTENSIONS = {".doc", ".docx"}

def allowed_file(name: str) -> bool:
    return os.path.splitext(name)[1].lower() in ALLOWED_EXTENSIONS

@router.post("/upload-doc/")
async def upload_doc(file: UploadFile = File(...)):
    if not allowed_file(file.filename):
        raise HTTPException(400, "Only .doc and .docx files are allowed")

    raw_dir, red_dir = "uploaded_docs", "redacted_docs"
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(red_dir, exist_ok=True)

    raw_path = os.path.join(raw_dir, file.filename)
    red_path = os.path.join(red_dir, f"redacted_{file.filename}")

    with open(raw_path, "wb") as f:
        f.write(await file.read())

    try:
        text, run_map, doc = build_buffer(raw_path)
        chunks  = split_text_into_chunks(text)

        results = detect_pii_from_chunks(chunks)

        print(json.dumps(results, indent=2))
        global_spans = []
        search_from = 0
        for idx, chunk in enumerate(chunks):
            chunk_text = chunk["text"]
            pos = text.find(chunk_text, search_from)

            if pos == -1:
                continue
            for s in results[idx].get("pii", []):
                if (
                    s.get("mask") is True
                    and isinstance(s.get("start"), int)
                    and isinstance(s.get("end"), int)
                    and s["start"] < s["end"]
                ):
                    gs = s.copy()
                    gs["start"] += pos
                    gs["end"] += pos
                    global_spans.append(gs)
            search_from = pos + len(chunk_text)

        spans = global_spans
        print("⏬ Spans being sent to redactor:")
        print(json.dumps(spans, indent=2))

        if not spans:
            raise HTTPException(422, "No PII spans to redact")

        # Count unique PII values (count by type and value combination)
        unique_pii_count = len(set((s.get("type", ""), s.get("value", "")) for s in spans if s.get("mask") is True))

        # ✅ ADDED: build buffer and map text-based spans to docx positions
        full_text, run_map, doc = build_buffer(raw_path)
        hits = []
        for s in spans:
            val = s["value"]
            n = len(val)
            for i in range(len(full_text) - n + 1):
                if SequenceMatcher(None, full_text[i:i+n], val).ratio() >= 0.95:
                    hits.append({**s, "start": i, "end": i+n})

        # 🔁 MODIFIED: use hits + buffer
        convert_pii_in_docx_span(raw_path, hits, red_path, text_and_map=(full_text, run_map, doc))

    except Exception as e:
        print("INTERNAL ERROR:", repr(e))
        raise HTTPException(500, f"Redaction error: {e}")

    return JSONResponse(
        status_code=200,
        content={
            "message": "File uploaded and redacted successfully.",
            "redacted_url": f"/redacted_docs/{os.path.basename(red_path)}",
            "pii_count": unique_pii_count,
            "total_spans": len(spans)
        }
    )
