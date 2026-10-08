import os
import sqlite3
import requests
from flask import Flask, request, jsonify
from database import init_db, get_db

# Load environment variables from .env file
ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

MINIMOTH_API_KEY = os.environ.get("MINIMOTH_API_KEY", "").strip()
MINIMOTH_BASE_URL = "https://api.minimoth.dev"

app = Flask(__name__)

# Basic CORS headers so React frontend can communicate seamlessly
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return "", 200

def normalize_phone(phone: str) -> str:
    """Normalize phone to international format (e.g. +91XXXXXXXXXX)."""
    p = phone.strip().replace(" ", "").replace("-", "")
    if not p.startswith("+") and len(p) == 10 and p.isdigit():
        p = "+91" + p
    return p

# Initialize DB tables on startup
init_db()


# -------------------------------------------------------------
# 1. POST /api/auth/send-otp
# -------------------------------------------------------------
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    data = request.get_json(silent=True) or {}
    raw_phone = data.get("phone", "").strip()

    if not raw_phone:
        return jsonify({"error": "Phone number is required"}), 400

    phone = normalize_phone(raw_phone)

    # If valid Minimoth API key is configured, call Minimoth API
    is_live_key = (
        MINIMOTH_API_KEY
        and MINIMOTH_API_KEY != "your_minimoth_api_key_here"
        and not MINIMOTH_API_KEY.startswith("mock_")
    )

    if is_live_key:
        try:
            resp = requests.post(
                f"{MINIMOTH_BASE_URL}/v1/otp/send",
                headers={
                    "X-Api-Key": MINIMOTH_API_KEY,
                    "Content-Type": "application/json",
                },
                json={"phone": phone},
                timeout=10,
            )
            resp_data = resp.json() if resp.content else {}
            if resp.status_code in [200, 201]:
                return jsonify({
                    "status": "success",
                    "message": "OTP sent via Minimoth",
                    "phone": phone,
                    "otp_id": resp_data.get("otp_id"),
                }), 200
            else:
                err_msg = resp_data.get("message") or resp_data.get("error") or "Minimoth error"
                return jsonify({"error": f"Minimoth error: {err_msg}"}), resp.status_code
        except requests.RequestException as e:
            return jsonify({"error": f"Failed to contact Minimoth API: {str(e)}"}), 502

    # Workshop / Demo fallback if no live API key is set
    return jsonify({
        "status": "success",
        "message": "Demo mode: OTP sent. Use 123456 to verify.",
        "phone": phone,
        "demo": True,
    }), 200


# -------------------------------------------------------------
# 2. POST /api/auth/verify-otp
# -------------------------------------------------------------
@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json(silent=True) or {}
    raw_phone = data.get("phone", "").strip()
    code = data.get("code", "").strip()
    name = data.get("name", "").strip() or "Student"

    if not raw_phone or not code:
        return jsonify({"error": "Phone number and OTP code are required"}), 400

    phone = normalize_phone(raw_phone)

    is_live_key = (
        MINIMOTH_API_KEY
        and MINIMOTH_API_KEY != "your_minimoth_api_key_here"
        and not MINIMOTH_API_KEY.startswith("mock_")
    )

    verified = False
    # Demo code support for workshop ease
    if code in ["123456", "000000"]:
        verified = True
    elif is_live_key:
        try:
            resp = requests.post(
                f"{MINIMOTH_BASE_URL}/v1/otp/verify",
                headers={
                    "X-Api-Key": MINIMOTH_API_KEY,
                    "Content-Type": "application/json",
                },
                json={"phone": phone, "code": code},
                timeout=10,
            )
            resp_data = resp.json() if resp.content else {}
            if resp.status_code in [200, 201]:
                verified = True
            else:
                err_msg = resp_data.get("message") or resp_data.get("error") or "Invalid OTP"
                return jsonify({"error": err_msg}), 400
        except requests.RequestException as e:
            return jsonify({"error": f"Failed to contact Minimoth API: {str(e)}"}), 502
    else:
        return jsonify({"error": "Invalid OTP code (Hint: use 123456 in demo mode)"}), 400

    if not verified:
        return jsonify({"error": "OTP verification failed"}), 400

    # User registration / lookup
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, phone, name FROM users WHERE phone = ?", (phone,))
    user = cursor.fetchone()

    if user:
        user_id = user["id"]
        # Update name if provided and not default
        if name != "Student" and user["name"] != name:
            cursor.execute("UPDATE users SET name = ? WHERE id = ?", (name, user_id))
            conn.commit()
            user_name = name
        else:
            user_name = user["name"]
    else:
        cursor.execute("INSERT INTO users (phone, name) VALUES (?, ?)", (phone, name))
        conn.commit()
        user_id = cursor.lastrowid
        user_name = name

    conn.close()

    return jsonify({
        "status": "success",
        "user": {
            "id": user_id,
            "phone": phone,
            "name": user_name,
        },
    }), 200


# -------------------------------------------------------------
# 3. GET /api/plans
# -------------------------------------------------------------
@app.route("/api/plans", methods=["GET"])
def get_plans():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter is required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            p.id, 
            p.user_id, 
            p.title, 
            p.target_date, 
            p.duration_minutes, 
            p.is_completed,
            s.id as subject_id,
            s.name as subject_name,
            s.color as subject_color
        FROM study_plans p
        JOIN subjects s ON p.subject_id = s.id
        WHERE p.user_id = ?
        ORDER BY p.target_date ASC, p.id DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    plans = []
    for r in rows:
        plans.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "title": r["title"],
            "target_date": r["target_date"],
            "duration_minutes": r["duration_minutes"],
            "is_completed": bool(r["is_completed"]),
            "subject_id": r["subject_id"],
            "subject_name": r["subject_name"],
            "subject_color": r["subject_color"],
        })

    return jsonify({"plans": plans}), 200


# -------------------------------------------------------------
# 4. POST /api/plans
# -------------------------------------------------------------
@app.route("/api/plans", methods=["POST"])
def create_plan():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    title = data.get("title", "").strip()
    subject_name = data.get("subject_name", "").strip()
    subject_color = data.get("subject_color", "#0d9488").strip() or "#0d9488"
    target_date = data.get("target_date", "").strip()
    duration_minutes = data.get("duration_minutes", 30)

    if not user_id or not title or not subject_name or not target_date:
        return jsonify({"error": "user_id, title, subject_name, and target_date are required"}), 400

    try:
        duration_minutes = int(duration_minutes)
        if duration_minutes <= 0:
            duration_minutes = 30
    except (ValueError, TypeError):
        duration_minutes = 30

    conn = get_db()
    cursor = conn.cursor()

    # Find or create subject
    cursor.execute("SELECT id FROM subjects WHERE user_id = ? AND name = ?", (user_id, subject_name))
    subject = cursor.fetchone()
    if subject:
        subject_id = subject["id"]
    else:
        cursor.execute(
            "INSERT INTO subjects (user_id, name, color) VALUES (?, ?, ?)",
            (user_id, subject_name, subject_color),
        )
        subject_id = cursor.lastrowid

    # Create study plan
    cursor.execute("""
        INSERT INTO study_plans (user_id, subject_id, title, target_date, duration_minutes, is_completed)
        VALUES (?, ?, ?, ?, ?, 0)
    """, (user_id, subject_id, title, target_date, duration_minutes))
    plan_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        "id": plan_id,
        "user_id": user_id,
        "title": title,
        "subject_id": subject_id,
        "subject_name": subject_name,
        "subject_color": subject_color,
        "target_date": target_date,
        "duration_minutes": duration_minutes,
        "is_completed": False,
    }), 201


# -------------------------------------------------------------
# 5. PATCH /api/plans/<int:plan_id>/toggle
# -------------------------------------------------------------
@app.route("/api/plans/<int:plan_id>/toggle", methods=["PATCH"])
def toggle_plan(plan_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT is_completed FROM study_plans WHERE id = ?", (plan_id,))
    plan = cursor.fetchone()

    if not plan:
        conn.close()
        return jsonify({"error": "Plan not found"}), 404

    new_status = 0 if plan["is_completed"] == 1 else 1
    cursor.execute("UPDATE study_plans SET is_completed = ? WHERE id = ?", (new_status, plan_id))
    conn.commit()
    conn.close()

    return jsonify({
        "id": plan_id,
        "is_completed": bool(new_status),
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
