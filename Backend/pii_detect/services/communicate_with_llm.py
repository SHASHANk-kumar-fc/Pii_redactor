import json, re, os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# load API key
load_dotenv(Path(__file__).resolve().parent / ".env")
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    timeout=60.0)
# load prompt template once

prompt_txt = (Path(__file__).parent / "prompt.txt").read_text(encoding="utf-8")

def _parse_json(raw: str) -> dict | None:


    # Remove Markdown fences
    raw = re.sub(r"^```[\w]*\n?|```$", "", raw.strip())

    # Extract first JSON object
    match = re.search(r"\{.*\}", raw, re.S)
    if not match:
        return None

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None

def _fallback_detect_pii(chunk_text: str, base_offset: int) -> list[dict]:
    """
    Basic regex fallback for when OpenAI is unavailable (e.g. missing/invalid key on Render).
    Produces a small set of high-confidence PII spans.
    """
    spans: list[dict] = []

    def add_span(pii_type: str, value: str, start: int, end: int):
        spans.append({
            "type": pii_type,
            "value": value,
            "start": start + base_offset,
            "end": end + base_offset,
            "mask": True
        })

    # email
    for m in re.finditer(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", chunk_text, re.I):
        add_span("email", m.group(0), m.start(), m.end())

    # phone (India-ish; keeps it simple)
    for m in re.finditer(r"\b(?:\+?91[-\s]?)?[6-9]\d{9}\b", chunk_text):
        add_span("phone", m.group(0), m.start(), m.end())

    # "Name: <something>" lines
    for m in re.finditer(r"\bName\s*:\s*([A-Za-z][A-Za-z .'-]{2,})", chunk_text):
        val = m.group(1).strip()
        # span only the name part
        name_start = m.start(1)
        name_end = m.end(1)
        add_span("name", val, name_start, name_end)

    return spans

def detect_pii_from_chunks(chunks: list[dict]) -> list[dict]:

    out: list[dict] = []

    for ck in chunks:
        chunk_text   = ck["text"]
        base_offset  = ck["offset"]

        prompt = prompt_txt.replace("{chunk}", chunk_text.strip())

        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a PII extractor."},
                    {"role": "user",   "content": prompt}
                ]
            )

            # ---- parse the assistant JSON reply ----
            parsed = _parse_json(resp.choices[0].message.content) or {}
            raw_spans = parsed.get("pii", [])

            # ---- keep only well‑formed spans & make them absolute ----
            full_spans = []
            for s in raw_spans:
                if (
                    isinstance(s, dict)
                    and s.get("mask") is True
                    and isinstance(s.get("start"), int)
                    and isinstance(s.get("end"), int)
                    and s["start"] < s["end"]
                ):
                    full_spans.append(
                        {
                            **s,
                            "start": s["start"] + base_offset,
                            "end":   s["end"]   + base_offset,
                        }
                    )
            out.append({"offset": base_offset, "pii": full_spans})
        except Exception as e:
            # If LLM fails (bad key, timeout, etc.), fall back to regex.
            fallback = _fallback_detect_pii(chunk_text, base_offset)
            out.append({"offset": base_offset, "pii": fallback, "fallback": True, "error": str(e)})

    return out
