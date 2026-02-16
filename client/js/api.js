import { State } from './state.js';

export const API = {
    socket: null,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    },

    init: function() {
        if(this.socket && this.socket.connected) return;
        
        this.socket = io({
            reconnectionAttempts: 5,
            timeout: 10000,
            transports: ['websocket', 'polling']
        });
        State.socket = this.socket;
        
        this.socket.on('connect', () => {
            if(State.user && State.user.uid) {
                this.socket.emit('identify', State.user.uid);
                if(State.activeChannel) this.socket.emit('join', State.activeChannel);
            }
        });

        this.socket.on('message', (msg) => window.Chat?.onMessage(msg));
        this.socket.on('reaction_update', (data) => window.Chat?.onReactionUpdate(data));
        this.socket.on('typing_update', (data) => window.Chat?.onTypingUpdate(data));
        this.socket.on('user_list_update', () => window.Navigation?.renderUsers());
    },

    // --- REST Endpoints ---

    getChannels: async () => {
        const res = await fetch('/api/channels');
        return res.json();
    },

    getUsers: async () => {
        const res = await fetch('/api/users');
        return res.json();
    },

    getMessages: async (cid) => {
        const res = await fetch(`/api/messages/${cid}`);
        return res.json();
    },

    // --- Socket Actions ---

    sendMessage: function(cid, text, nonce, reply_to) {
        if(!this.socket?.connected) this.init();
        this.socket.emit('send_message', { cid, text, uid: State.user.uid, nonce, reply_to });
    },

    addReaction: function(mid, emoji) {
        if(!this.socket?.connected) this.init();
        this.socket.emit('add_reaction', { mid, emoji, uid: State.user.uid });
    },

    sendTyping: function(cid, isTyping) {
        if(this.socket?.connected) {
            this.socket.emit('typing', { cid, uid: State.user.uid, isTyping });
        }
    },

    // --- Profile ---
    
    loginGuest: async function(username, avatar) {
        try {
            const res = await fetch('/api/guest', {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ username, avatar })
            });
            return await res.json();
        } catch (e) { return { error: "Server Error" }; }
    },

    updateProfile: async function(uid, username, avatar) {
        const res = await fetch(`/api/users/${uid}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ username, avatar })
        });
        return res.json();
    }
};
