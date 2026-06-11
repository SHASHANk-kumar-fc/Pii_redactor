# Hide.AI
### AI-Powered PII Detection & Document Redaction

<p align="center">
  AI system that automatically detects and redacts Personally Identifiable Information (PII) from documents using LLM-powered extraction and span-based masking.
</p>

---

## 🚀 Demo

### Main Page
<img width="100%" alt="Main Page 1" src="https://github.com/user-attachments/assets/0ee4a831-b406-4eb8-8a75-31840054095f" />
<img width="100%" alt="Main Page 2" src="https://github.com/user-attachments/assets/7751b9b5-81cd-4fd5-9cc0-2ec33ebef9d8" />

### Authentication
| Login Page | Sign up Page |
| :--- | :--- |
| <img src="https://github.com/user-attachments/assets/7ea8a515-8c19-4065-9613-15dc4a17f70e" width="100%" /> | <img src="https://github.com/user-attachments/assets/f2c99dc9-60e0-41a5-b412-22c0826b7698" width="100%" /> |

### Workflow
**Upload Document**
<img width="100%" alt="Upload Document" src="https://github.com/user-attachments/assets/885fb9d6-c5a3-4455-bf02-22fbdd250f51" />

**Download Page**
<img width="100%" alt="Download Page" src="https://github.com/user-attachments/assets/bf807361-ea03-4838-bf82-4efa98ce5eb0" />

### Features

* **AI-powered PII detection** using LLM
* **Span-based redaction** that preserves document formatting
* **Comprehensive format support**:
    * Paragraphs
    * Tables
    * Headers
    * Footers
    * Textboxes
* **Drag-and-drop** document upload
* **Animated PII detection** counter
* **Secure** document download
* **Email-verified** authentication
* **Firebase** user database


<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/de3804f2-a455-4e67-90cb-5161eea8cc69" />

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite |
| **Backend** | FastAPI |
| **AI** | OpenAI GPT |
| **Database** | Firebase Realtime Database |
| **Document Processing** | `python-docx` |
| **XML Processing** | `lxml` |

## 📁 Project Structure

```text
hide-ai
│
├── frontend-app/          # React + TypeScript (Vite)
│   ├── src/
│   └── dist/              # production build (served by FastAPI)
│
├── Backend/pii_detect/
│   ├── app/
│   │   ├── main.py
│   │   └── routes.py
│   ├── services/
│   └── signup/
```
## 🛠️ Redaction Pipeline

1. **Extract document text**
   Text is extracted from `.docx` documents including tables and paragraphs.

2. **Split document into chunks**
   Large documents are divided into token-based chunks for efficient AI processing.

3. **Detect PII using LLM**
   Each chunk is analyzed by the LLM to detect sensitive information.
   
   **Example output:**
   ```json
   {
    "pii": [
      {
        "start": 120,
        "end": 132,
        "value": "John Doe",
        "mask": true
      }
    ]
   }
│
├── signup
│   ├── firebase_config.py
│   ├── Login.py
│   └── signup.py
│
└── main.py

---

# 🔍 Redaction Pipeline

### 1. Extract document text
Text is extracted from `.docx` documents including tables and paragraphs.

### 2. Split document into chunks
Large documents are divided into token-based chunks for efficient AI processing.

### 3. Detect PII using LLM
Each chunk is analyzed by the LLM to detect sensitive information.

Example output:

```json
{
 "pii": [
   {
     "start": 120,
     "end": 132,
     "value": "John Doe",
     "mask": true
   }
 ]
}
```
4. **Map spans to document**
   Detected spans are mapped back to the original document structure, ensuring that the detected PII corresponds exactly to its location within paragraphs, tables, or textboxes.

5. **Redact sensitive values**
   PII values are replaced with `X` characters while strictly preserving the original document formatting (font, size, and alignment).
   
   **Example Transformation:**
   * **Name:** `John Doe` → `XXXXXXXX`
   * **Phone:** `9876543210` → `XXXXXXXXXX`
   * **Email:** `shashank@example.com` → `XXXXXXXXXXXXXXXXXXXX`
---

## ⚙️ Installation

### Clone repository

```bash
git clone https://github.com/yourusername/hide-ai.git
cd hide-ai
```

### Install backend dependencies

```bash
pip install -r requirements.txt
```

### Install frontend dependencies

```bash
cd frontend-app
npm install
cd ..
```

### Setup environment variables

Create `.env`

```
OPENAI_API_KEY=your_api_key
```

### Build frontend & run backend

```bash
cd frontend-app
npm run build
cd ..
uvicorn Backend.pii_detect.app.main:app --reload
```

Open **http://127.0.0.1:8000** in your browser. FastAPI serves the React app and API from the same origin.

### Frontend development (optional)

Run the Vite dev server with hot reload while the API runs on port 8000:

```bash
# Terminal 1
uvicorn Backend.pii_detect.app.main:app --reload

# Terminal 2
cd frontend-app
npm run dev
```

Open **http://localhost:5173** — API requests are proxied to port 8000.

---

## 🔒 Security

- Email verification before account activation
- Firebase secure user storage
- LLM output validation
- Span validation before masking

---

## 🚀 Future Improvements

- PDF document support
- Batch document processing
- Real-time redaction preview
- Role-based access control
- Cloud deployment

---

## 👨‍💻 Author

Shashank  
AI & Backend Developer

---

