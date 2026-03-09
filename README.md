Hide.AI
AI-Powered PII Detection and Document Redaction

Hide.AI is a web application that automatically detects and redacts Personally Identifiable Information (PII) from .docx documents using LLM-based extraction and span-level masking.

The system allows users to securely upload documents, identify sensitive data, and download a fully redacted version of the document.

Demo Workflow
Upload Document
      ↓
AI scans for PII
      ↓
Sensitive values detected
      ↓
Document redacted
      ↓
Secure download

Example:

Input:
Name: John Doe
Phone: 9876543210

Output:
Name: XXXXXXXX
Phone: XXXXXXXXXX
Key Features

• AI-powered PII detection using LLM
• Accurate span-based document redaction
• Supports tables, headers, footers, and textboxes
• Drag-and-drop document upload
• Real-time processing UI with counter animation
• Secure email-verified authentication
• Firebase user database
• Downloadable redacted documents

Tech Stack
Frontend

HTML

CSS

JavaScript

FontAwesome

Backend

FastAPI

Python

python-docx

lxml

AI Processing

OpenAI API

GPT-4o-mini

Database

Firebase Realtime Database

Authentication

Email verification with FastAPI Mail

System Architecture
User
 ↓
Frontend (HTML/CSS/JS)
 ↓
FastAPI Backend
 ↓
Text Extraction
 ↓
Chunking Engine
 ↓
LLM PII Detection
 ↓
Span Mapping
 ↓
Document Redaction
 ↓
Download Redacted File
Project Structure
hide-ai
│
├── frontend
│   ├── main.html
│   ├── home.html
│   ├── upload.html
│   ├── download.html
│   ├── style.css
│   └── script.js
│
├── pii_detect
│   ├── text_conversion.py
│   ├── divide_the_content.py
│   ├── communicate_with_llm.py
│   ├── replace_pii_values.py
│   └── redact_textboxes_only.py
│
├── signup
│   ├── firebase_config.py
│   ├── Login.py
│   └── signup.py
│
└── main.py
How the Redaction Pipeline Works
1️⃣ Extract document text

The system extracts text from .docx files including tables and paragraphs.

2️⃣ Split document into chunks

Large documents are split into token-based chunks to allow efficient AI processing.

3️⃣ Detect PII using LLM

Each chunk is analyzed by the LLM to detect PII spans.

4️⃣ Map spans to document

Detected spans are mapped back to the document buffer.

5️⃣ Mask sensitive values

PII values are replaced with X characters while preserving document formatting.

Installation
Clone repository
git clone https://github.com/yourusername/hide-ai.git
cd hide-ai
Install dependencies
pip install -r requirements.txt
Add environment variables

Create .env

OPENAI_API_KEY=your_api_key
Run backend
uvicorn main:app --reload
Open frontend

Open

main.html

in your browser.

Security

Email verification before account creation

Secure Firebase storage

LLM output validation

Span validation before masking

Future Improvements

PDF support

Batch document processing

Advanced PII classification

Role-based user access

Cloud deployment

Author

Shashank
Backend & AI Developer
