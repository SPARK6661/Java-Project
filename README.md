# 📖 Study Planner

A minimalist, distraction-free full-stack study planner built for a 45-minute workshop. It features phone-based OTP authentication via the **[Minimoth API](https://minimoth.dev)**, task scheduling with custom subject tags, and progress tracking.

---

## 🎯 Architecture & Workshop Constraints

This project adheres strictly to minimal workshop constraints:
* **Frontend:** React (Vite) with **maximum 3 pages**:
  1. `AuthPage`: Phone input, OTP request via Minimoth, and verification.
  2. `PlannerPage`: Study dashboard with session filters, progress statistics, and one-click completion.
  3. `AddPlanPage`: Plan creation form with subject tagging, color selection, target date, and focus duration presets.
* **Backend:** Python (Flask) with **maximum 5 API endpoints**:
  1. `POST /api/auth/send-otp` - Initiates OTP delivery via Minimoth.
  2. `POST /api/auth/verify-otp` - Verifies OTP with Minimoth and registers/authenticates the user.
  3. `GET /api/plans?user_id=<id>` - Retrieves the user's study sessions with subjects.
  4. `POST /api/plans` - Creates a study session and attaches/creates the subject.
  5. `PATCH /api/plans/<id>/toggle` - Toggles session completion status.
* **Database:** SQLite with **strictly 3 entities**:
  1. `users` (id, phone, name, created_at)
  2. `subjects` (id, user_id, name, color)
  3. `study_plans` (id, user_id, subject_id, title, target_date, duration_minutes, is_completed, created_at)

---

## 📁 Project Structure

```
Study-Planner/
├── backend/
│   ├── app.py             # Flask application (5 endpoints & Minimoth integration)
│   ├── database.py        # SQLite database setup (3 models)
│   ├── requirements.txt   # Minimal Python dependencies
│   ├── .env.example       # Backend environment template
│   └── .env               # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── api.js         # API client module
│   │   ├── App.jsx        # Top-level state & 3-page router
│   │   ├── App.css        # Clean, unique study theme styling
│   │   ├── index.css      # Design tokens & base styles
│   │   ├── main.jsx       # React entrypoint
│   │   └── pages/
│   │       ├── AuthPage.jsx     # Page 1: Minimoth OTP Login/Register
│   │       ├── PlannerPage.jsx  # Page 2: Study Sessions Dashboard
│   │       └── AddPlanPage.jsx  # Page 3: New Plan Form
│   ├── package.json
│   ├── vite.config.js     # Dev server proxy configuration
│   ├── .env.example       # Frontend environment template
│   └── .env               # Frontend environment variables
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Python 3.10+**
* **Node.js 18+** & npm

---

### 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your Minimoth API key in `backend/.env`:
   ```env
   MINIMOTH_API_KEY=mm_live_your_actual_key_here
   PORT=5000
   ```
   > **Note for Workshop Demos:** If you leave `MINIMOTH_API_KEY` unset or as a placeholder, the app operates in demo mode where OTP `123456` verifies instantly.

4. Start the backend server:
   ```bash
   python app.py
   ```
   The API will run on `http://127.0.0.1:5000`.

---

### 3. Frontend Setup
1. In a new terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Ensure `frontend/.env` points to your backend:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🔑 Authentication Flow (Minimoth API)

1. The user inputs their phone number (e.g. `9812345678` or `+919812345678`).
2. The backend sends a request to `https://api.minimoth.dev/v1/otp/send`.
3. Minimoth dispatches the OTP code primarily via **WhatsApp**, falling back to **SMS** if WhatsApp is unavailable.
4. The user submits the 6-digit OTP code along with their name.
5. The backend verifies the code with `https://api.minimoth.dev/v1/otp/verify`.
6. Upon successful verification, the user account is created/retrieved in SQLite and a session is started.
