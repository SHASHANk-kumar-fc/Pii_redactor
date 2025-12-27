import json, re, os
import time
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

def detect_pii_from_chunks(chunks: list[dict]) -> list[dict]:

    out: list[dict] = []

    for ck in chunks:
        chunk_text   = ck["text"]
        base_offset  = ck["offset"]

        prompt = prompt_txt.replace("{chunk}", chunk_text.strip())

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

        time.sleep(21)

    return out
