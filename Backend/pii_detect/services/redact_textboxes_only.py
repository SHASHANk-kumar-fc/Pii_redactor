from lxml import etree
import os, shutil, zipfile


def redact_text_in_textboxes(docx_path: str, pii_values: list[str]):
    temp_dir = "temp_docx_shapes"
    word_xml = os.path.join(temp_dir, "word", "document.xml")
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

    # Extract .docx
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)

    # Parse XML
    tree = etree.parse(word_xml)
    root = tree.getroot()

    redacted_count = 0
    for txbx in root.xpath(".//w:txbxContent", namespaces=ns):
        for t in txbx.xpath(".//w:t", namespaces=ns):
            if t.text:
                for pii in pii_values:
                    if pii in t.text:
                        print(f"🔧 Redacting textbox content: '{pii}'")
                        t.text = t.text.replace(pii, "X" * len(pii))
                        redacted_count += 1

    # Write back and rezip
    tree.write(word_xml, xml_declaration=True, encoding="utf-8")
    with zipfile.ZipFile(docx_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for folder, _, files in os.walk(temp_dir):
            for f in files:
                full = os.path.join(folder, f)
                arcname = os.path.relpath(full, temp_dir)
                zf.write(full, arcname=arcname)

    shutil.rmtree(temp_dir)
    print(f"✅ Redacted {redacted_count} matches in textboxes.")
