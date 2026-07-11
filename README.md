# MaintainIQ 🛠️ - AI-Powered QR Maintenance & Asset History Platform

**MaintainIQ** is a professional asset and maintenance-management platform that gives physical assets a digital identity, a QR-accessible public page, an issue-reporting portal, and a permanent activity log history. 

This repository implements **Track A (Advanced Full-Stack + GenAI)** for the SMIT Final Hackathon (Batch 17).

---

## 🚀 Key Features

*   **Authentication & Role-Based Access Control:** Secure routes and actions enforced on the backend for both `Admin` and `Technician` roles.
*   **Asset Registration & QR Labels:** Admins can register physical equipment with unique codes, automatically generating a scannable QR code linking to the asset's safe public portal.
*   **Safe Public Asset Page:** A mobile-friendly page exposing only safe information (name, status, location, last/next service targets, and general timeline) without leaking cost or technician details.
*   **AI-Powered Issue Triage:** When a user files a natural language complaint, the system uses Google Gemini AI (`gemini-1.5-flash`) to generate a professional title, suggest categories/priorities, evaluate possible causes, and suggest safe diagnostic checks.
*   **Technician Workflow & Maintenance Logging:** Technicians can inspect their assigned tickets, update statuses, record parts replaced, validate non-negative repair costs, and upload media evidence (photo logs).
*   **Permanent Asset History Log:** Critical changes (registration, status updates, repairs, and retirement) are automatically logged as immutable history events.

---

## 🛠️ Technology Stack

*   **Frontend:** React (Vite), Tailwind CSS v4, Lucide React (Icons), React Router.
*   **Backend:** Node.js, Express, Sequelize (ORM), SQLite (`sqlite3` local database).
*   **AI Integration:** `@google/generative-ai` SDK with smart local fallback classifier.
*   **Media Evidence Upload:** Multer (local disk storage at `/uploads`).
*   **QR Code Rendering:** `qrcode` Base64 generator.

---

## 🔐 Demo Credentials

To test the application immediately, use the following preloaded credentials:

*   **Administrator Account:**
    *   **Email:** `admin@maintainiq.com`
    *   **Password:** `admin123`
*   **Technician Account:**
    *   **Email:** `tech@maintainiq.com`
    *   **Password:** `tech123`

---

## ⚙️ Project Setup

### Prerequisites
*   Node.js (v18+ recommended)
*   npm (v9+)

### Installation & Run

1.  **Clone or Open the project directory**
2.  **Start Backend Server:**
    ```bash
    cd backend
    npm install
    # (Optional) Create a .env file and add your GEMINI_API_KEY
    npm start
    ```
    *The server runs on `http://localhost:5000` and automatically seeds default users and 5 default assets if database is empty.*

3.  **Start Frontend Server:**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```
    *The Vite React client starts on `http://localhost:5173`.*

---

## 📡 API Documentation

### Authentication Routes
*   `POST /api/auth/register` - Create a user account.
*   `POST /api/auth/login` - Sign in user (returns JWT token & credentials).
*   `GET /api/auth/me` - Fetch profile metadata (JWT protected).
*   `GET /api/auth/technicians` - Get list of all technicians (Admin only).

### Asset Routes
*   `GET /api/assets` - Search and filter assets (Admin & Tech).
*   `GET /api/assets/public/:code` - Retrieve safe asset details by QR code.
*   `POST /api/assets` - Register a new asset & generate QR (Admin only).
*   `PUT /api/assets/:id` - Update asset metadata (Admin only).
*   `DELETE /api/assets/:id` - Retire asset (Admin only).

### Issue Ticket Routes
*   `GET /api/issues` - Retrieve active tickets (Filtered by role).
*   `GET /api/issues/:issueNumber` - Fetch detailed ticket records.
*   `POST /api/issues` - Report an issue against an asset (Public).
*   `PUT /api/issues/:id/assign` - Assign technician to issue (Admin only).
*   `PUT /api/issues/:id/status` - Transition status of work order (Admin/Tech).

### Maintenance & AI Routes
*   `POST /api/maintenance` - File maintenance log and resolve ticket. Enforces non-negative cost and media upload.
*   `POST /api/ai/triage` - Take user's natural language complaint, analyze it alongside asset history, and return Gemini structured diagnostic suggestions.

---

## 🤖 AI Triage Prompt & Safety Fallback
The AI triage prompt reads:
1.  **Context Assembly:** Combines the user complaint, asset category, name, location, and its 5 most recent service tickets.
2.  **Safety Policy:** Enforces warning notifications for recurring failures and restricts dangerous electrical or mechanical actions for laypeople.
3.  **Local Fallback:** In the absence of a `GEMINI_API_KEY`, a local regex and keyword parser processes complaints to ensure a flawless presentation and zero system downtime.
