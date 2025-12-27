from pathlib import Path
from pii_detect.services.replace_pii_values import convert_pii_in_docx_span, build_buffer

src_docx = r"C:\Users\HP\Downloads\BONAFIDE AND FRONT PAGE-Android[1] (1).docx"
dst_docx = r"C:\Users\HP\Downloads\redacted_fixed_span611.docx"

spans = [
    {
      "type": "student_reg_no",
      "value": "RA2432241030055",
      "start": 1321,
      "end": 1336,
      "mask": True
    },
    {
      "type": "student_reg_no",
      "value": "RA2432241030055",
      "start": 1337,
      "end": 1352,
      "mask": True
    },
    {
      "type": "name",
      "value": "Shashank Kumar",
      "start": 546,
      "end": 561,
      "mask": True
    },
    {
      "type": "name",
      "value": "Shashank Kumar",
      "start": 1365,
      "end": 1380,
      "mask": True
    }
]

# ✅ Build the buffer once
text, run_map, doc = build_buffer(src_docx)

# ✅ Use the spans as-is (no fuzzy matching needed)
convert_pii_in_docx_span(src_docx, spans, dst_docx, text_and_map=(text, run_map, doc))
