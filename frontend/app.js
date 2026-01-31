// --- Configuration ---
// REPLACE 'your-app-name' with your actual Render URL after deployment
const BACKEND_URL = "https://novusordo-backend.onrender.com"; 
const socket = io(BACKEND_URL);

// DOM Elements
const registrationArea = document.getElementById('registration-area');
const callArea = document.getElementById('call-area');
const activeCallArea = document.getElementById('active-call-area');
const incomingModal = document.getElementById('incoming-modal');
const remoteAudio = document.getElementById('remote-audio');

const usernameInput = document.getElementById('username-input');
const targetIdInput = document.getElementById('target-id-input');
const displayId = document.getElementById('display-id');
const remoteUserId = document.getElementById('remote-user-id');
const callStatus = document.getElementById('call-status');
const callerNameSpan = document.getElementById('caller-name');

let myId = "";
let localStream = null;
let peer = null;
let currentCallData = null;

// --- Step 1: Registration & Push Setup ---

document.getElementById('register-btn').addEventListener('click', async () => {
    myId = usernameInput.value.trim().toLowerCase();
    if (!myId) return alert("Please enter a Call ID");

    try {
        // Request Notification Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            alert("Permission for notifications is required for incoming calls.");
        }

        // Register Service Worker and get Subscription
        const registration = await navigator.serviceWorker.register('sw.js');
        
        // YOUR SPECIFIC PUBLIC KEY APPLIED HERE
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BBek4z_L25C-DYDDJoKS7nuK2LTGsjuMe5eY_u8vH2nHZwbMy-KN4W4Q25jo7EwwIhAULMO_IT93OcM4g3FiGuY'
        });

        // Send to Backend
        const response = await fetch(`${BACKEND_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: myId,
                displayName: myId,
                subscription: subscription
            })
        });

        if (response.ok) {
            socket.emit('join', myId);
            showArea('call');
            displayId.innerText = `@${myId}`;
        }
    } catch (err) {
        console.error("Registration failed:", err);
        alert("Setup failed. Ensure you are using HTTPS.");
    }
});

// --- Step 2: Media & Calling Logic ---

async function getMedia() {
    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
    return localStream;
}

document.getElementById('start-call-btn').addEventListener('click', async () => {
    const targetId = targetIdInput.value.trim().toLowerCase();
    if (!targetId) return alert("Enter receiver ID");

    await getMedia();
    showArea('active');
    remoteUserId.innerText = `@${targetId}`;
    callStatus.innerText = "Ringing...";

    peer = new SimplePeer({ initiator: true, trickle: false, stream: localStream });

    peer.on('signal', (data) => {
        socket.emit('start-call', {
            targetUserId: targetId,
            callerId: myId,
            callerName: myId,
            signalData: data
        });
    });

    peer.on('stream', (stream) => {
        remoteAudio.srcObject = stream;
        callStatus.innerText = "In Call";
    });
});

// --- Step 3: Handling Incoming Calls ---

socket.on('incoming-call', (data) => {
    currentCallData = data;
    callerNameSpan.innerText = `@${data.from}`;
    incomingModal.classList.remove('hidden');
});

document.getElementById('accept-btn').addEventListener('click', async () => {
    incomingModal.classList.add('hidden');
    await getMedia();
    showArea('active');
    remoteUserId.innerText = `@${currentCallData.from}`;

    peer = new SimplePeer({ initiator: false, trickle: false, stream: localStream });

    peer.on('signal', (data) => {
        socket.emit('accept-call', { to: currentCallData.from, signalData: data });
    });

    peer.on('stream', (stream) => {
        remoteAudio.srcObject = stream;
        callStatus.innerText = "In Call";
    });

    peer.signal(currentCallData.signalData);
});

socket.on('call-accepted', (signalData) => {
    peer.signal(signalData);
    callStatus.innerText = "In Call";
});

// --- Step 4: UI & Ending Calls ---

document.getElementById('hangup-btn').addEventListener('click', endCall);
document.getElementById('reject-btn').addEventListener('click', () => {
    incomingModal.classList.add('hidden');
});

socket.on('call-ended', () => {
    alert("Call Ended");
    location.reload(); 
});

function endCall() {
    if (peer) peer.destroy();
    socket.emit('end-call', { to: remoteUserId.innerText.replace('@', '') });
    location.reload();
}

function showArea(area) {
    registrationArea.classList.add('hidden');
    callArea.classList.add('hidden');
    activeCallArea.classList.add('hidden');

    if (area === 'call') callArea.classList.remove('hidden');
    if (area === 'active') activeCallArea.classList.remove('hidden');
}
