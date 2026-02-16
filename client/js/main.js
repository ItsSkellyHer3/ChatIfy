import { State, clearUser, updateSettings } from './state.js';
import { API } from './api.js';
import { UI } from './ui.js';
import { Auth } from './auth.js';
import { Chat } from './chat.js';
import { Navigation } from './modules/navigation.js';
import { Settings } from './modules/settings.js';

// Globalize for direct HTML access
window.Auth = Auth;
window.Chat = Chat;
window.UI = UI;
window.API = API;
window.Navigation = Navigation;
window.Settings = Settings;

export const App = {
    start: async function() {
        console.log("[Chatify] Application started.");
        
        // Ensure theme is applied on boot
        updateSettings({});

        // Global Handlers
        window.onblur = () => {
            if(State.settings.privacyBlur) document.body.classList.add('blur-sm');
            document.title = "Chatify";
        };
        window.onfocus = () => {
            document.body.classList.remove('blur-sm');
            document.title = "Chatify";
        };

        window.onkeydown = (e) => {
            if(e.shiftKey && e.key === 'Escape') this.terminateSession();
            if(e.altKey && e.code === 'KeyQ') Settings.saveSetting('stealthMode', !State.settings.stealthMode);
        };

        const path = window.location.pathname;

        if(path.includes('chat.html')) {
            if(!State.user) { window.location.href = '/'; return; }
            this.initChatUI();
        } else if(path.includes('settings.html')) {
            if(!State.user) { window.location.href = '/'; return; }
            this.initSettingsUI();
        } else {
            // Landing page - REDIRECT if already logged in
            if(State.user && State.user.uid) {
                window.location.href = '/chat.html';
                return;
            }
            this.initLandingUI();
        }
    },

    initLandingUI: function() {
        if(window.lucide) lucide.createIcons();
    },

    initChatUI: function() {
        API.init();
        const myName = document.getElementById('my-name');
        const myAvatar = document.getElementById('my-avatar');
        if(myName) myName.innerText = State.user.name;
        if(myAvatar) myAvatar.src = State.user.avatar;
        
        Navigation.init();
        this.initGlobalResetTimer();
        
        Chat.load('general', 'General');
        if(window.lucide) lucide.createIcons();
    },

    initSettingsUI: function() {
        Settings.init();
        if(window.lucide) lucide.createIcons();
    },

    initGlobalResetTimer: function() {
        const appTimer = document.getElementById('app-reset-timer');
        if(!appTimer) return;
        
        const tick = () => {
            const now = new Date();
            const mins = 59 - now.getMinutes();
            const secs = 59 - now.getSeconds();
            const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            appTimer.innerText = timeStr;
            if(mins === 0 && secs === 0) clearUser();
        };
        tick();
        setInterval(tick, 1000);
    },

    terminateSession: function() {
        localStorage.clear();
        window.location.href = '/';
    },

    toggleTheme: function() {
        const currentTheme = State.settings.theme || 'onyx';
        const newTheme = currentTheme === 'pearl' ? 'onyx' : 'pearl';
        this.setTheme(newTheme);
    },

    openRepo: function() {
        window.open('https://github.com/ItsSkellyHer3/ChatIfy', '_blank');
    },

    setTheme: function(theme) {
        updateSettings({ theme });
    }
};

window.App = App;
window.onload = () => { App.start(); };
