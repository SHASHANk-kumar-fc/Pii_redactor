import tiktoken
from typing import List
def split_text_into_chunks(text: str,
                           chunk_size: int = 1000,
                           overlap: int = 100):
    """
    Yields dicts: {"text": <chunk>, "offset": <absolute start in full text>}
    """
    tokenizer  = tiktoken.get_encoding("cl100k_base")
    tokens     = tokenizer.encode(text)
    total_tok  = len(tokens)

    chunks = []
    tok_start = 0
    char_start = 0

    while tok_start < total_tok:
        tok_end   = min(tok_start + chunk_size, total_tok)
        chunk_txt = tokenizer.decode(tokens[tok_start:tok_end])

        chunks.append({"text": chunk_txt, "offset": char_start})
        print(f"✅ Chunk {len(chunks)} — tokens {tok_start}:{tok_end}  chars {char_start}:{char_start+len(chunk_txt)}")

        if tok_end == total_tok:
            break

        # slide window
        tok_start  = tok_end - overlap
        char_start += len(chunk_txt) - overlap  # keep char offset in sync

    return chunks
