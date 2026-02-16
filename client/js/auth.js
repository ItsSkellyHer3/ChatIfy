import { API } from './api.js';
import { State, saveUser, clearUser } from './state.js';

export const Auth = {
    currentAvatar: `https://api.dicebear.com/7.x/micah/svg?seed=${Math.random()}`,

    randomizeAvatar: function() {
        this.currentAvatar = `https://api.dicebear.com/7.x/micah/svg?seed=${Math.random()}`;
        const img = document.getElementById('landing-avatar');
        if(img) img.src = this.currentAvatar;
    },

    createSession: async function() {
        const nameInput = document.getElementById('username-input');
        const username = nameInput ? nameInput.value.trim() : '';
        const btn = document.getElementById('start-btn');
        
        if(!username) {
            alert("Please enter a username.");
            return;
        }

        if(btn) {
            btn.disabled = true;
            btn.innerText = "Connecting...";
        }
        
        try {
            const res = await API.loginGuest(username, this.currentAvatar);
            if(res && res.user) {
                saveUser(res.user);
                window.location.href = '/chat.html';
            } else {
                throw new Error(res.error || "Login failed");
            }
        } catch(e) {
            alert(e.message);
            if(btn) {
                btn.disabled = false;
                btn.innerText = "Join Chat";
            }
        }
    },

    logout: () => {
        if(confirm("Terminate session?")) {
            clearUser();
        }
    },

    loginAsGuest: function() {
        const randomID = Math.floor(1000 + Math.random() * 9000);
        const name = `Guest #${randomID}`;
        
        const nameInput = document.getElementById('username-input');
        if(nameInput) nameInput.value = name;
        
        this.currentAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`;
        this.createSession();
    }
};