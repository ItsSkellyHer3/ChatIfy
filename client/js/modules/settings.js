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

        document.querySelectorAll('.nav-item').forEach(btn => {
            const isActive = btn.id === `nav-${tab}`;
            btn.classList.toggle('bg-slate-100', isActive);
            btn.classList.toggle('dark:bg-white/10', isActive);
            btn.classList.toggle('text-black', isActive);
            btn.classList.toggle('dark:text-white', isActive);
            btn.classList.toggle('font-bold', isActive);
            if(!isActive) {
                btn.classList.remove('bg-slate-100', 'dark:bg-white/10', 'text-black', 'dark:text-white', 'font-bold');
                btn.classList.add('text-slate-500', 'dark:text-slate-400', 'hover:bg-slate-50', 'dark:hover:bg-white/5');
            }
        });

        const s = State.settings;
        let html = '';

        const headerClass = "text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-1";
        const subHeaderClass = "text-xs md:text-sm text-slate-500 mb-6 md:mb-8";
        const cardClass = "bg-white dark:bg-surface border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-8 shadow-sm";

        if(tab === 'profile') {
            html = `
                <div class="max-w-3xl animate-fade">
                    <h2 class="${headerClass}">Account</h2>
                    <p class="${subHeaderClass}">Manage your public identity within the workspace.</p>
                    
                    <div class="${cardClass} space-y-6">
                        <div class="flex flex-col sm:flex-row items-center gap-6">
                            <div class="relative group">
                                <img id="settings-avatar-preview" src="${State.user.avatar}" class="w-24 h-24 rounded-2xl border-2 border-slate-100 dark:border-white/10 shadow-md object-cover">
                                <button onclick="Settings.randomizeProfile()" class="absolute -bottom-2 -right-2 bg-black dark:bg-white text-white dark:text-black p-2 rounded-lg shadow-lg">
                                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                            
                            <div class="flex-1 w-full space-y-4">
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                                    <input type="text" id="settings-username" value="${State.user.name}" class="w-full px-4 py-3 bg-slate-50 dark:bg-dark border border-slate-200 dark:border-white/10 rounded-xl focus:border-black dark:focus:border-white outline-none text-slate-900 dark:text-white font-bold transition-all">
                                </div>
                                <button onclick="Settings.saveProfile()" class="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold transition-all hover:opacity-80">
                                    Update Profile
                                </button>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div class="space-y-1">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                                <div class="flex items-center gap-2">
                                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span class="text-xs font-medium text-slate-900 dark:text-white">Active</span>
                                </div>
                            </div>
                            <div class="space-y-1 text-right">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">License</span>
                                <span class="text-xs font-medium text-slate-900 dark:text-white block">MIT Open Source</span>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-4">
                        <img src="https://avatars.githubusercontent.com/ItsSkellyHer3" class="w-10 h-10 rounded-full grayscale" alt="ItsSkellyHer3">
                        <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-900 dark:text-white">Developed by ItsSkellyHer3</span>
                            <span class="text-[10px] text-slate-500">GitHub Open Source Project</span>
                        </div>
                        <a href="https://github.com/ItsSkellyHer3" target="_blank" class="ml-auto p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                            <i data-lucide="github" class="w-4 h-4 text-slate-400"></i>
                        </a>
                    </div>
                </div>
            `;
        } else if(tab === 'privacy') {
            html = `
                <div class="max-w-3xl animate-fade">
                    <h2 class="${headerClass}">Preferences</h2>
                    <p class="${subHeaderClass}">Control notification sounds and interface behavior.</p>
                    
                    <div class="space-y-4">
                        <div class="${cardClass} flex items-center justify-between">
                            <div class="flex flex-col gap-0.5">
                                <h4 class="font-bold text-slate-900 dark:text-white text-sm">Notification Sounds</h4>
                                <p class="text-[11px] text-slate-500">Play a sound for incoming messages.</p>
                            </div>
                            <input type="checkbox" onchange="Settings.saveSetting('sounds', this.checked)" ${s.sounds ? 'checked' : ''} class="w-4 h-4 accent-black dark:accent-white cursor-pointer">
                        </div>

                        <div class="${cardClass} flex items-center justify-between">
                            <div class="flex flex-col gap-0.5">
                                <h4 class="font-bold text-slate-900 dark:text-white text-sm">Privacy Blur</h4>
                                <p class="text-[11px] text-slate-500">Blur screen when inactive.</p>
                            </div>
                            <input type="checkbox" onchange="Settings.saveSetting('privacyBlur', this.checked)" ${s.privacyBlur ? 'checked' : ''} class="w-4 h-4 accent-black dark:accent-white cursor-pointer">
                        </div>

                        <div class="${cardClass} flex items-center justify-between">
                            <div class="flex flex-col gap-0.5">
                                <h4 class="font-bold text-slate-900 dark:text-white text-sm">Stealth Mode</h4>
                                <p class="text-[11px] text-slate-500">Hide UI elements (Alt+Q).</p>
                            </div>
                            <input type="checkbox" onchange="Settings.saveSetting('stealthMode', this.checked)" ${s.stealthMode ? 'checked' : ''} class="w-4 h-4 accent-black dark:accent-white cursor-pointer">
                        </div>
                        
                        <div class="pt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
                            <button onclick="Settings.clearHistory()" class="w-full p-4 text-left bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors group">
                                <div class="flex items-center justify-between">
                                    <div class="flex flex-col gap-0.5">
                                        <h4 class="font-bold text-slate-900 dark:text-white text-sm">Clear Local Messages</h4>
                                        <p class="text-[11px] text-slate-500">Empty your local message view.</p>
                                    </div>
                                    <i data-lucide="trash-2" class="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors"></i>
                                </div>
                            </button>

                            <button onclick="Settings.terminateSession()" class="w-full p-4 text-left border border-red-100 dark:border-red-500/10 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                                <div class="flex items-center justify-between">
                                    <div class="flex flex-col gap-0.5">
                                        <h4 class="font-bold text-red-600 dark:text-red-500 text-sm">Reset Everything</h4>
                                        <p class="text-[11px] text-red-600/60 dark:text-red-500/60">Delete identity and all local data.</p>
                                    </div>
                                    <i data-lucide="log-out" class="w-4 h-4 text-red-500"></i>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else if(tab === 'theme') {
            html = `
                <div class="max-w-3xl animate-fade">
                    <h2 class="${headerClass}">Appearance</h2>
                    <p class="${subHeaderClass}">Customize your visual environment.</p>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div class="${cardClass}">
                            <h4 class="font-bold text-slate-900 dark:text-white text-xs mb-4 uppercase tracking-wider">Theme</h4>
                            <div class="grid grid-cols-2 gap-3">
                                <button onclick="Settings.saveSetting('theme', 'onyx')" class="group">
                                    <div class="aspect-video bg-dark border-2 rounded-xl mb-2 flex items-center justify-center ${s.theme === 'onyx' ? 'border-black dark:border-white ring-4 ring-slate-100 dark:ring-white/5' : 'border-slate-100 dark:border-white/5'}">
                                        <div class="w-4 h-4 bg-white/10 rounded-full"></div>
                                    </div>
                                    <span class="text-[10px] font-bold ${s.theme === 'onyx' ? 'text-black dark:text-white' : 'text-slate-400'}">DARK</span>
                                </button>
                                <button onclick="Settings.saveSetting('theme', 'pearl')" class="group">
                                    <div class="aspect-video bg-white border-2 rounded-xl mb-2 flex items-center justify-center ${s.theme === 'pearl' ? 'border-black dark:border-white ring-4 ring-slate-100 dark:ring-white/5' : 'border-slate-100 dark:border-white/5'}">
                                        <div class="w-4 h-4 bg-slate-100 rounded-full border border-slate-200"></div>
                                    </div>
                                    <span class="text-[10px] font-bold ${s.theme === 'pearl' ? 'text-black dark:text-white' : 'text-slate-400'}">LIGHT</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="${cardClass}">
                            <h4 class="font-bold text-slate-900 dark:text-white text-xs mb-4 uppercase tracking-wider">Scale</h4>
                            <div class="space-y-2">
                                ${['Comfortable', 'Compact'].map(sz => `
                                    <button onclick="Settings.saveSetting('fontSize', '${sz.toLowerCase()}')" class="w-full px-4 py-2.5 rounded-lg text-[11px] font-bold text-left flex items-center justify-between ${s.fontSize === sz.toLowerCase() ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-slate-500 bg-slate-50 dark:bg-white/5 hover:bg-slate-100'}">
                                        ${sz.toUpperCase()}
                                        ${s.fontSize === sz.toLowerCase() ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if(tab === 'backup') {
            html = `
                <div class="max-w-3xl animate-fade">
                    <h2 class="${headerClass}">Data Control</h2>
                    <p class="${subHeaderClass}">Export or import your identity and local settings.</p>
                    
                    <div class="${cardClass} text-center py-10 space-y-6">
                        <div class="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                            <i data-lucide="database" class="w-6 h-6"></i>
                        </div>
                        <p class="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">Identity backups contain your name, avatar, and app preferences. Message history is not saved.</p>
                        
                        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button onclick="Settings.exportData()" class="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs transition-transform hover:scale-105 shadow-md flex items-center gap-2">
                                <i data-lucide="download" class="w-3.5 h-3.5"></i> Export JSON
                            </button>
                            <label class="px-6 py-2.5 bg-white dark:bg-surface border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-2">
                                <i data-lucide="upload" class="w-3.5 h-3.5"></i> Import JSON
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
        const name = "User_" + Math.floor(1000 + Math.random() * 9000);
        const avatar = `https://api.dicebear.com/7.x/micah/svg?seed=${name + Date.now()}`;
        const input = document.getElementById('settings-username');
        const img = document.getElementById('settings-avatar-preview');
        if(input) input.value = name;
        if(img) img.src = avatar;
    },

    saveProfile: async function() {
        const username = document.getElementById('settings-username').value;
        const avatar = document.getElementById('settings-avatar-preview').src;
        if(!username) return alert("Username required");
        
        try {
            const res = await API.updateProfile(State.user.uid, username, avatar);
            if(!res.error) {
                const updatedUser = { ...State.user, name: username, avatar: avatar };
                localStorage.setItem('chatify_user', JSON.stringify(updatedUser));
                State.user = updatedUser;
                alert("Profile Updated");
                this.render('profile');
            }
        } catch(e) { alert("Error updating profile."); }
    },

    clearHistory: function() {
        const feed = document.getElementById('messages-feed');
        if(feed) feed.innerHTML = '';
    },

    terminateSession: function() {
        if(confirm("Permanently delete identity and local data?")) {
            localStorage.clear();
            window.location.href = '/';
        }
    },

    exportData: function() {
        const data = { 
            chatify_backup: {
                user: State.user, 
                settings: State.settings, 
                version: "13.0.6"
            }
        };
        const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatify_backup.json`;
        a.click();
    },

    importData: function(input) {
        const file = input.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const reg = data.chatify_backup || data;
                if(reg.settings) localStorage.setItem('chatify_settings', JSON.stringify(reg.settings));
                if(reg.user) localStorage.setItem('chatify_user', JSON.stringify(reg.user));
                alert("Backup Restored");
                location.reload();
            } catch(err) { alert("Invalid Backup"); }
        };
        reader.readAsText(file);
    }
};

window.Settings = Settings;
