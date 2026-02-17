import { State, updateSettings } from '../state.js';
import { API } from '../api.js';

export const Settings = {
    activeTab: 'profile',

    init: function() {
        if(window.location.pathname.includes('settings.html')) {
            this.render('profile');
        }
    },

    render: function(tab = 'profile') {
        this.activeTab = tab;
        const container = document.getElementById('settings-content-root');
        if(!container) return;

        // Update Sidebar Active State
        document.querySelectorAll('.nav-item').forEach(btn => {
            const isActive = btn.id === `nav-${tab}`;
            if(isActive) {
                btn.classList.add('bg-zinc-200', 'dark:bg-zinc-800', 'text-black', 'dark:text-white');
                btn.classList.remove('hover:bg-zinc-100', 'dark:hover:bg-zinc-900', 'text-zinc-500');
            } else {
                btn.classList.remove('bg-zinc-200', 'dark:bg-zinc-800', 'text-black', 'dark:text-white');
                btn.classList.add('hover:bg-zinc-100', 'dark:hover:bg-zinc-900', 'text-zinc-500');
            }
        });

        const s = State.settings;
        let html = '';

        const h1 = "text-2xl font-bold tracking-tight mb-1";
        const p = "text-xs font-medium text-zinc-400 mb-8";
        const card = "bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-lg p-6 mb-6 transition-all";
        const label = "text-[11px] font-bold text-zinc-400 uppercase tracking-tight mb-2 block";

        if(tab === 'profile') {
            html = `
                <div class="animate-fade-in">
                    <h1 class="${h1}">Identity</h1>
                    <p class="${p}">Update your public profile information.</p>
                    
                    <div class="${card}">
                        <div class="flex flex-col md:flex-row items-center gap-8">
                            <div class="relative group">
                                <img id="settings-avatar-preview" src="${State.user.avatar}" class="w-24 h-24 rounded-full border border-black/5 dark:border-white/5 object-cover shadow-sm">
                                <button onclick="Settings.randomizeProfile()" class="absolute -bottom-1 -right-1 bg-black dark:bg-white text-white dark:text-black p-2 rounded-full shadow hover:scale-110 transition-transform">
                                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                            
                            <div class="flex-1 w-full space-y-4">
                                <div class="space-y-1">
                                    <label class="${label}">Username</label>
                                    <input type="text" id="settings-username" value="${State.user.name}" class="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-black/5 dark:border-white/5 rounded focus:border-black dark:focus:border-white outline-none text-black dark:text-white font-bold transition-all">
                                </div>
                                <button onclick="Settings.saveProfile()" class="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded font-bold text-xs uppercase tracking-tight hover:opacity-80 transition-all">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if(tab === 'privacy') {
            html = `
                <div class="animate-fade-in">
                    <h1 class="${h1}">Privacy</h1>
                    <p class="${p}">Manage your security and notification preferences.</p>
                    
                    <div class="space-y-2">
                        <div class="${card} flex items-center justify-between py-4">
                            <div class="space-y-0.5">
                                <h4 class="font-bold text-md">Audio Alerts</h4>
                                <p class="text-[11px] font-medium text-zinc-400">Play sound for incoming messages.</p>
                            </div>
                            <input type="checkbox" onchange="Settings.saveSetting('sounds', this.checked)" ${s.sounds ? 'checked' : ''} class="w-5 h-5 accent-black dark:accent-white cursor-pointer">
                        </div>

                        <div class="${card} flex items-center justify-between py-4">
                            <div class="space-y-0.5">
                                <h4 class="font-bold text-md">Privacy Blur</h4>
                                <p class="text-[11px] font-medium text-zinc-400">Blur message feed when app is inactive.</p>
                            </div>
                            <input type="checkbox" onchange="Settings.saveSetting('privacyBlur', this.checked)" ${s.privacyBlur ? 'checked' : ''} class="w-5 h-5 accent-black dark:accent-white cursor-pointer">
                        </div>

                        <div class="${card} flex items-center justify-between py-4">
                            <div class="space-y-0.5">
                                <h4 class="font-bold text-md">Stealth Mode</h4>
                                <p class="text-[11px] font-medium text-zinc-400">Minimize visibility of some UI elements.</p>
                            </div>
                            <input type="checkbox" onchange="Settings.saveSetting('stealthMode', this.checked)" ${s.stealthMode ? 'checked' : ''} class="w-5 h-5 accent-black dark:accent-white cursor-pointer">
                        </div>
                    </div>
                </div>
            `;
        } else if(tab === 'theme') {
            html = `
                <div class="animate-fade-in">
                    <h1 class="${h1}">Appearance</h1>
                    <p class="${p}">Customize the visual theme and layout density.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="${card}">
                            <label class="${label}">Theme</label>
                            <div class="grid grid-cols-2 gap-3">
                                <button onclick="Settings.saveSetting('theme', 'onyx')" class="text-center">
                                    <div class="aspect-square bg-zinc-900 border rounded-lg flex items-center justify-center transition-all ${s.theme === 'onyx' ? 'border-white' : 'border-transparent opacity-60'}">
                                        <div class="w-4 h-4 bg-white rounded-full"></div>
                                    </div>
                                    <span class="text-[10px] font-bold uppercase mt-2 block">Dark</span>
                                </button>
                                <button onclick="Settings.saveSetting('theme', 'pearl')" class="text-center">
                                    <div class="aspect-square bg-zinc-100 border rounded-lg flex items-center justify-center transition-all ${s.theme === 'pearl' ? 'border-black' : 'border-transparent opacity-60'}">
                                        <div class="w-4 h-4 bg-black rounded-full"></div>
                                    </div>
                                    <span class="text-[10px] font-bold uppercase mt-2 block">Light</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="${card}">
                            <label class="${label}">Text Size</label>
                            <div class="space-y-2">
                                ${['Comfortable', 'Compact'].map(sz => `
                                    <button onclick="Settings.saveSetting('fontSize', '${sz.toLowerCase()}')" class="w-full py-2.5 rounded font-bold text-xs transition-all ${s.fontSize === sz.toLowerCase() ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-400 hover:bg-black/5'}">
                                        ${sz}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if(tab === 'backup') {
            html = `
                <div class="animate-fade-in">
                    <h1 class="${h1}">Maintenance</h1>
                    <p class="${p}">Export or import your user profile and settings.</p>
                    
                    <div class="${card} text-center py-12 space-y-6">
                        <div class="w-16 h-16 bg-zinc-50 dark:bg-zinc-950 rounded-xl flex items-center justify-center mx-auto">
                            <i data-lucide="database" class="w-8 h-8 text-zinc-300"></i>
                        </div>
                        <p class="text-xs font-medium text-zinc-400 max-w-xs mx-auto">Archives contain your name, avatar, and settings. Message history is ephemeral.</p>
                        
                        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button onclick="Settings.exportData()" class="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded font-bold text-xs uppercase hover:opacity-80 transition-all">
                                Export Data
                            </button>
                            <label class="px-6 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-black/5 dark:border-white/5 text-black dark:text-white rounded font-bold text-xs uppercase cursor-pointer hover:bg-black/5 transition-all">
                                Import Data
                                <input type="file" class="hidden" onchange="Settings.importData(this)">
                            </label>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        if(window.lucide) lucide.createIcons();
    },

    saveSetting: function(key, val) {
        updateSettings({ [key]: val });
        this.render(this.activeTab);
    },

    randomizeProfile: function() {
        const name = "USER_" + Math.floor(1000 + Math.random() * 9000);
        const avatar = `https://api.dicebear.com/7.x/micah/svg?seed=${name + Date.now()}`;
        const input = document.getElementById('settings-username');
        const img = document.getElementById('settings-avatar-preview');
        if(input) input.value = name;
        if(img) img.src = avatar;
    },

    saveProfile: async function() {
        const username = document.getElementById('settings-username').value;
        const avatar = document.getElementById('settings-avatar-preview').src;
        if(!username) return;
        
        try {
            const res = await API.updateProfile(State.user.uid, username, avatar);
            if(!res.error) {
                const updatedUser = { ...State.user, name: username, avatar: avatar };
                localStorage.setItem('chatify_user', JSON.stringify(updatedUser));
                State.user = updatedUser;
                this.render('profile');
            }
        } catch(e) {}
    },

    terminateSession: function() {
        if(confirm("TERMINATE SESSION AND WIPE LOCAL DATA?")) {
            localStorage.clear();
            window.location.href = '/';
        }
    },

    exportData: function() {
        const data = { chatify_archive: { user: State.user, settings: State.settings } };
        const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `chatify_archive_${Date.now()}.json`;
        a.click();
    },

    importData: function(input) {
        const file = input.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const reg = data.chatify_archive || data;
                if(reg.settings) localStorage.setItem('chatify_settings', JSON.stringify(reg.settings));
                if(reg.user) localStorage.setItem('chatify_user', JSON.stringify(reg.user));
                location.reload();
            } catch(err) {}
        };
        reader.readAsText(file);
    }
};

window.Settings = Settings;
