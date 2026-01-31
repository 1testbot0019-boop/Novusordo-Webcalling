# Novusordo-Webcalling
# Novusordo: Privacy-First Web Calling

Novusordo is a browser-based audio calling platform built with WebRTC. It eliminates the need for phone numbers, SIM cards, or invasive tracking by using unique Call IDs and Peer-to-Peer communication.

## 🌟 Key Features
- **P2P Audio:** Direct browser-to-browser voice communication.
- **Privacy-First:** Zero call logging, no recording, and minimal data storage.
- **Web Push Notifications:** Receive incoming calls even when the browser tab is closed via Service Workers.
- **Universal Access:** Works on any modern web browser without an APK or mobile installation.
- **Secure by Design:** Media streams are encrypted E2EE via WebRTC standards.

## 🏗️ Project Structure
```text
/
├── backend/                # Node.js Signaling & Push Server
│   ├── .env                # Server configuration
│   ├── package.json        # Dependencies
│   └── server.js           # Socket.IO & Web Push logic
└── frontend/               # GitHub Pages Hosted UI
    ├── index.html          # Main interface
    ├── style.css           # Styling
    ├── manifest.json       # PWA metadata
    ├── app.js              # WebRTC engine
    └── sw.js               # Background Service Worker

🛠️ Technical Stack
Frontend: Vanilla JavaScript, HTML5, CSS3

WebRTC Library: Simple-Peer

Real-time Signaling: Socket.IO

Backend: Node.js & Express

Database: MongoDB Atlas (Free Tier)

Push Services: Web Push (VAPID)

🛡️ Privacy Policy
Novusordo is designed to protect user identity:

No Phone Numbers: Communication is based on chosen usernames.

No Contact Syncing: Your address book remains private on your device.

No Data Recording: Audio data is transmitted directly between peers and is never stored on the server.

Minimal Metadata: The database only stores the active push subscription required to "wake up" the browser for an incoming call.

🚦 Limitations
HTTPS: Both the frontend and backend must be served over HTTPS for WebRTC and Web Push to function.

User Interaction: Due to browser "Autoplay" policies, the receiver must click the notification or interact with the page to start audio playback.
