import { State } from './state.js';

export const API = {
    socket: null,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    },

    init: function() {
        if(this.socket) return;
        
        console.log("[API] Establishing secure connection...");
        this.socket = io({
            reconnectionAttempts: 10,
            timeout: 20000,
            transports: ['websocket', 'polling'],
            extraHeaders: {
                "ngrok-skip-browser-warning": "true"
            }
        });
        State.socket = this.socket;
        
        this.socket.on('connect', () => {
            console.log("[API] Connection verified.");
            if(State.user && State.user.uid) {
                this.socket.emit('identify', State.user.uid);
                if(State.activeChannel) this.socket.emit('join', State.activeChannel);
            }
        });

        this.socket.on('message', (msg) => {
            if(window.Chat) window.Chat.onMessage(msg);
        });

        this.socket.on('typing_update', (data) => {
            if(window.Chat) window.Chat.onTypingUpdate(data);
        });

        this.socket.on('user_list_update', () => {
            if(window.UI) window.UI.renderUsers();
        });
        
        this.socket.on('disconnect', (reason) => {
            console.warn("[API] Connection lost:", reason);
        });
    },

    loginGuest: async function(username, avatar) {
        try {
            const res = await fetch('/api/guest', {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ username, avatar })
            });
            return await res.json();
        } catch (e) { return { error: "Server unreachable" }; }
    },

    updateProfile: async function(uid, username, avatar) {
        try {
            const res = await fetch(`/api/users/${uid}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify({ username, avatar })
            });
            return await res.json();
        } catch (e) { return { error: "Server unreachable" }; }
    },

    getUsers: async () => {
        const res = await fetch('/api/users', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        return res.json();
    },

    getChannels: async () => {
        const res = await fetch('/api/channels', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        return res.json();
    },

    getMessages: async (cid) => {
        const res = await fetch(`/api/messages/${cid}`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        return res.json();
    },

    deleteMessage: async (mid, uid) => {
        const res = await fetch(`/api/messages/${mid}?uid=${uid}`, {
            method: 'DELETE',
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        return res.json();
    },

    sendMessage: function(cid, text, nonce = null, reply_to = null) {
        if(this.socket && this.socket.connected) {
            this.socket.emit('send_message', { cid, text, uid: State.user.uid, nonce, reply_to });
        } else {
            console.error("[API] Socket inactive");
            this.init();
        }
    },

    checkHealth: async () => {
        try {
            const res = await fetch('/api/health', { 
                method: 'GET', 
                headers: { 'ngrok-skip-browser-warning': 'true' },
                cache: 'no-store' 
            });
            return res.ok;
        } catch (e) { return false; }
    },

    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'ngrok-skip-browser-warning': 'true' },
            body: formData
        });
        return res.json();
    },

    downloadSource: function() {
        window.open('https://github.com/ItsSkellyHer3/ChatIfy', '_blank');
    },

    sendTyping: function(cid, isTyping) {
        if(this.socket && this.socket.connected) {
            this.socket.emit('typing', { cid, uid: State.user.uid, isTyping });
        }
    }
};
