const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const webpush = require('web-push');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Failed:", err.message));

const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true, required: true },
    displayName: String,
    pushSubscription: Object,
    socketId: String,
    lastSeen: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// --- Web Push Setup ---
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        'mailto:support@novusordo.com',
        publicVapidKey,
        privateVapidKey
    );
    console.log("✅ Web Push VAPID keys configured");
}

// --- API Routes ---

// NEW: This is the missing POST route your frontend is calling
app.post('/register', async (req, res) => {
    const { userId, displayName, subscription } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { userId },
            { userId, displayName, pushSubscription: subscription, lastSeen: Date.now() },
            { upsert: true, new: true }
        );
        console.log(`📝 Registered/Updated User in DB: ${userId}`);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("❌ Registration Route Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- Socket.IO Handshake ---
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`🔌 New Connection: ${socket.id}`);

    socket.on('join', async (userId) => {
        try {
            await User.findOneAndUpdate({ userId }, { socketId: socket.id });
            console.log(`👤 User @${userId} is now online`);
        } catch (err) {
            console.error("Error updating user socket:", err.message);
        }
    });

    socket.on('start-call', async (data) => {
        const { targetUserId, callerId, signalData, callerName } = data;
        const targetUser = await User.findOne({ userId: targetUserId });

        if (targetUser && targetUser.socketId && io.sockets.sockets.get(targetUser.socketId)) {
            io.to(targetUser.socketId).emit('incoming-call', {
                signalData,
                from: callerId,
                callerName
            });
            console.log(`📞 Direct signal sent from ${callerId} to ${targetUserId}`);
        } else if (targetUser && targetUser.pushSubscription) {
            const payload = JSON.stringify({
                title: 'Incoming Call',
                body: `${callerName} is calling you...`,
                data: { callerId, type: 'CALL_REQUEST' }
            });

            webpush.sendNotification(targetUser.pushSubscription, payload)
                .then(() => console.log(`🔔 Push notification sent to ${targetUserId}`))
                .catch(err => console.error("Push Notification Error:", err));
        }
    });

    socket.on('accept-call', async (data) => {
        const { to, signalData } = data;
        const caller = await User.findOne({ userId: to });
        if (caller && caller.socketId) {
            io.to(caller.socketId).emit('call-accepted', signalData);
        }
    });

    socket.on('end-call', async (data) => {
        const { to } = data;
        const otherUser = await User.findOne({ userId: to });
        if (otherUser && otherUser.socketId) {
            io.to(otherUser.socketId).emit('call-ended');
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Disconnected: ${socket.id}`);
    });
});

app.get('/', (req, res) => {
    res.send('Novusordo Signaling Server is Live 🚀');
});

server.listen(PORT, () => {
    console.log(`🚀 Signaling server running on port ${PORT}`);
});
