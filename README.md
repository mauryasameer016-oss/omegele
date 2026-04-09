# 🌐 stranger.chat

A real-time anonymous chat application that connects random strangers for text or video chat. Built with Python (Flask + Socket.IO) backend and React frontend, using WebRTC for peer-to-peer video.

---

## 📁 Project Structure

```
stranger-chat/
├── backend/
│   ├── app.py                  # Flask entry point
│   ├── requirements.txt
│   ├── database.db             # Auto-created on first run
│   ├── models/
│   │   └── database.py         # SQLite schema & init
│   ├── routes/
│   │   ├── auth.py             # /api/auth/*
│   │   ├── user.py             # /api/user/*
│   │   └── admin.py            # /api/admin/*
│   └── socket/
│       └── events.py           # Socket.IO matchmaking + WebRTC signaling
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css            # Global minimalist white theme
        ├── context/
        │   ├── AuthContext.js   # JWT auth state
        │   └── SocketContext.js # Socket.IO connection
        ├── hooks/
        │   └── useWebRTC.js     # WebRTC peer connection logic
        ├── pages/
        │   ├── LandingPage.js
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── ChatPage.js      # Main chat UI
        │   ├── HistoryPage.js
        │   └── AdminPage.js     # Admin dashboard
        └── components/
            ├── common/
            │   └── NavBar.js
            └── user/
                ├── TextChat.js
                └── VideoChat.js
```

---

## ⚙️ Prerequisites

- **Python 3.9+**
- **Node.js 16+** and npm
- A modern browser (Chrome/Firefox recommended for WebRTC)

---

## 🚀 How to Run

### Step 1 — Backend

```bash
cd stranger-chat/backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate it
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

The backend runs at **http://localhost:5000**

On first run it will:
- Create `database.db` automatically
- Seed a default admin account: **admin / admin123**

---

### Step 2 — Frontend

Open a **new terminal**:

```bash
cd stranger-chat/frontend

# Install dependencies
npm install

# Start the dev server
npm start
```

The frontend runs at **http://localhost:3000**

---

## 🔑 Default Accounts

| Role  | Username | Password  | URL               |
|-------|----------|-----------|-------------------|
| Admin | admin    | admin123  | /admin            |
| User  | (register at /register) |  | /chat |

> ⚠️ Change the admin password after first login in production!

---

## ✨ Features

### User Features
- **Anonymous or registered** — register for history tracking
- **Text chat** — real-time messaging via Socket.IO
- **Video chat** — peer-to-peer video via WebRTC (no relay needed on LAN)
- **Next Stranger** — instantly skip to someone new
- **Connection history** — see your last 50 connections
- **Report** — flag inappropriate users

### Admin Features
- **Dashboard** — total users, active today, sessions, reports
- **User management** — ban/unban users
- **Session log** — view all chat sessions
- **Reports queue** — review and resolve user reports
- **Admin activity log** — audit trail of admin actions

### Tech Highlights
- **Socket.IO** for real-time matchmaking and signaling
- **WebRTC** for direct peer-to-peer video (no media server needed)
- **JWT** authentication with Flask-JWT-Extended
- **SQLite** — zero-config local database
- **Eventlet** — async Socket.IO backend

---

## 🌐 WebRTC Notes

- Video chat works **on the same machine or local network** without any TURN server
- For **production / internet** deployments you'll need a TURN server (e.g. Twilio, Xirsys) and add credentials to `useWebRTC.js`:

```js
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'youruser',
      credential: 'yourpassword'
    }
  ]
};
```

---

## 🔒 Production Checklist

1. Change `SECRET_KEY` and `JWT_SECRET_KEY` in `backend/app.py`
2. Change admin password
3. Add a TURN server for WebRTC over the internet
4. Run behind nginx + gunicorn/eventlet
5. Enable HTTPS (required for camera access in browsers)
6. Set `CORS` origins to your actual domain

---

## 🛠️ API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | JWT | Get current user |
| GET | /api/user/history | JWT | Connection history |
| GET | /api/user/stats | JWT | User stats |
| POST | /api/user/report | JWT | Report a user |
| GET | /api/admin/stats | Admin JWT | Platform stats |
| GET | /api/admin/users | Admin JWT | List users |
| POST | /api/admin/users/:id/ban | Admin JWT | Ban user |
| POST | /api/admin/users/:id/unban | Admin JWT | Unban user |
| GET | /api/admin/reports | Admin JWT | List reports |
| POST | /api/admin/reports/:id/resolve | Admin JWT | Resolve report |
| GET | /api/admin/sessions | Admin JWT | List sessions |
| GET | /api/admin/logs | Admin JWT | Admin audit logs |

### Socket.IO Events

| Event (emit) | Payload | Description |
|-------------|---------|-------------|
| join_queue | `{token, mode}` | Join matchmaking |
| leave_queue | — | Leave queue |
| skip | `{token, mode}` | Skip current partner |
| send_message | `{message}` | Send chat message |
| end_session | — | End current session |
| webrtc_offer | `{offer}` | WebRTC offer (video) |
| webrtc_answer | `{answer}` | WebRTC answer (video) |
| webrtc_ice_candidate | `{candidate}` | ICE candidate |

| Event (receive) | Payload | Description |
|----------------|---------|-------------|
| status | `{status, message}` | Queue status update |
| matched | `{partner, mode, is_initiator}` | Matched with stranger |
| receive_message | `{message, timestamp}` | Incoming message |
| partner_disconnected | `{message}` | Partner left |
| webrtc_offer/answer/ice_candidate | ... | WebRTC signaling |
