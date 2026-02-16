import { State, updateSettings } from '../state.js';
import { API } from '../api.js';

export const Settings = {
    activeTab: 'profile',

    init: function() {
        if(window.location.pathname.includes('settings.html')) {
            this.render('profile');
        }
    },

    toggle: function(show) {
        // Implement modal or page toggle if needed
    },

    render: function(tab = 'profile') {
        this.activeTab = tab;
        const container = document.getElementById('settings-content-root');
        if(!container) return;

        // Active state for sidebar buttons
        document.querySelectorAll('.nav-item').forEach(btn => {
            const isActive = btn.id === `nav-${tab}`;
            btn.classList.toggle('active', isActive);
            
            // Clean classes
            if(!isActive) {
                btn.classList.remove('bg-gray-100', 'dark:bg-white/10', 'text-black', 'dark:text-white', 'font-bold');
            }
        });

        const s = State.settings;
        let html = '';

        const headerClass = "text-2xl font-bold text-slate-900 dark:text-white mb-2";
        const subHeaderClass = "text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-lg";
        const cardClass = "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8 shadow-sm shadow-slate-100 dark:shadow-none";

        if(tab === 'profile') {
            html = `
                <div class="max-w-4xl animate-fade">
                    <h2 class="${headerClass}">Account Settings</h2>
                    <p class="${subHeaderClass}">Configure your public profile and identity attributes within the workspace.</p>
                    
                    <div class="${cardClass} flex flex-col md:flex-row gap-8 items-start">
                        <div class="relative group mx-auto md:mx-0">
                            <img id="settings-avatar-preview" src="${State.user.avatar}" class="w-32 h-32 rounded-3xl border-4 border-slate-100 dark:border-white/10 shadow-lg object-cover">
                            <button onclick="Settings.randomizeProfile()" class="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-xl hover:scale-110 transition-transform shadow-lg border-4 border-white dark:border-surface">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                            </button>
                        </div>
                        
                        <div class="flex-1 w-full space-y-6">
                            <div class="space-y-2">
                                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest">Public Name</label>
                                <input type="text" id="settings-username" value="${State.user.name}" class="w-full px-4 py-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 dark:text-white font-bold transition-all">
                            </div>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div class="p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tier</span>
                                    <span class="text-sm font-bold text-slate-900 dark:text-white block mt-1">Open Source</span>
                                </div>
                                <div class="p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">License</span>
                                    <span class="text-sm font-bold text-slate-900 dark:text-white block mt-1">MIT Standard</span>
                                </div>
                            </div>

                            <button onclick="Settings.saveProfile()" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10">
                                Update Profile
                            </button>
                        </div>
                    </div>

                    <div class="mt-8 flex items-center gap-4 p-6 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10">
                        <img src="https://github.com/ItsSkellyHer3.png" class="w-10 h-10 rounded-full border-2 border-white dark:border-dark" alt="ItsSkellyHer3">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-blue-900 dark:text-blue-400">Developed by ItsSkellyHer3</span>
                            <span class="text-[10px] text-blue-800/60 dark:text-blue-400/60">Community-driven communication project.</span>
                        </div>
                        <a href="https://github.com/ItsSkellyHer3" target="_blank" class="ml-auto p-2 hover:bg-blue-200/50 dark:hover:bg-blue-500/20 rounded-lg transition-colors">
                            <i data-lucide="github" class="w-4 h-4 text-blue-600 dark:text-blue-400"></i>
                        </a>
                    </div>
                </div>
            `;
        } else if(tab === 'privacy') {
            html = `
                <div class="max-w-4xl animate-fade">
                    <h2 class="${headerClass}">Security Configuration</h2>
                    <p class="${subHeaderClass}">Manage session security and interface visibility modules.</p>
                    
                    <div class="grid gap-6">
                        <div class="${cardClass} flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-colors cursor-pointer" onclick="document.getElementById('stealth-check').click()">
                            <div class="flex flex-col gap-1">
                                <h4 class="font-bold text-slate-900 dark:text-white">Stealth Interface</h4>
                                <p class="text-xs text-slate-500">Shortcut: ALT+Q</p>
                            </div>
                            <input type="checkbox" id="stealth-check" onchange="Settings.saveSetting('stealthMode', this.checked)" ${s.stealthMode ? 'checked' : ''} class="w-5 h-5 accent-blue-600 cursor-pointer">
                        </div>

                        <div class="${cardClass} flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-colors cursor-pointer" onclick="document.getElementById('blur-check').click()">
                            <div class="flex flex-col gap-1">
                                <h4 class="font-bold text-slate-900 dark:text-white">Automatic Blur</h4>
                                <p class="text-xs text-slate-500">Blur messages when focus is lost.</p>
                            </div>
                            <input type="checkbox" id="blur-check" onchange="Settings.saveSetting('privacyBlur', this.checked)" ${s.privacyBlur ? 'checked' : ''} class="w-5 h-5 accent-blue-600 cursor-pointer">
                        </div>
                        
                        <div class="mt-8 p-6 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-2xl">
                            <h4 class="font-bold text-red-600 dark:text-red-500 text-sm mb-1">Purge Local Data</h4>
                            <p class="text-[11px] text-red-600/70 dark:text-red-500/70 mb-4">Warning: This action will permanently remove your identity keys and local settings.</p>
                            <button onclick="Settings.terminateSession()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[11px] font-bold transition-colors">
                                Reset Workspace
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else if(tab === 'theme') {
            html = `
                <div class="max-w-4xl animate-fade">
                    <h2 class="${headerClass}">Appearance</h2>
                    <p class="${subHeaderClass}">Choose your preferred theme and visual density.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="${cardClass}">
                            <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-6">Interface Theme</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <button onclick="Settings.saveSetting('theme', 'onyx')" class="group text-left">
                                    <div class="aspect-video bg-dark border-2 rounded-xl mb-2 flex items-center justify-center ${s.theme === 'onyx' ? 'border-blue-600 ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-white/5 group-hover:border-slate-400'} transition-all overflow-hidden relative">
                                        <div class="w-6 h-6 bg-white/10 rounded-full"></div>
                                    </div>
                                    <span class="text-xs font-bold ${s.theme === 'onyx' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}">Onyx Dark</span>
                                </button>
                                <button onclick="Settings.saveSetting('theme', 'pearl')" class="group text-left">
                                    <div class="aspect-video bg-white border-2 rounded-xl mb-2 flex items-center justify-center ${s.theme === 'pearl' ? 'border-blue-600 ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-white/5 group-hover:border-slate-400'} transition-all overflow-hidden relative">
                                        <div class="w-6 h-6 bg-slate-100 rounded-full"></div>
                                    </div>
                                    <span class="text-xs font-bold ${s.theme === 'pearl' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}">Pearl Light</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="${cardClass}">
                            <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-6">Visual Density</h4>
                            <div class="space-y-2">
                                ${['Comfortable', 'Compact'].map(sz => `
                                    <button onclick="Settings.saveSetting('fontSize', '${sz.toLowerCase()}')" class="w-full px-4 py-3 rounded-xl font-bold text-xs text-left flex items-center justify-between transition-colors ${s.fontSize === sz.toLowerCase() ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10'}">
                                        ${sz}
                                        ${s.fontSize === sz.toLowerCase() ? '<i data-lucide="check" class="w-3.5 h-3.5"></i>' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if(tab === 'backup') {
            html = `
                <div class="max-w-4xl animate-fade">
                    <h2 class="${headerClass}">Data Control</h2>
                    <p class="${subHeaderClass}">Export your settings or import an existing identity.</p>
                    
                    <div class="${cardClass} text-center py-10">
                        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <i data-lucide="database" class="w-8 h-8 text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Backups</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">Export your identity and settings to a JSON file. Messages are not included.</p>
                        
                        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onclick="Settings.exportData()" class="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm transition-transform hover:scale-105 shadow-xl flex items-center gap-2">
                                <i data-lucide="download" class="w-4 h-4"></i> Export
                            </button>
                            <label class="px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-2">
                                <i data-lucide="upload" class="w-4 h-4"></i> Import
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

    getCurrentTab: function() {
        return this.activeTab;
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
                alert("Profile successfully updated.");
                if(window.location.pathname.includes('settings.html')) this.render('profile');
            }
        } catch(e) { alert("Failed to update profile."); }
    },

    terminateSession: function() {
        if(confirm("Are you sure? This will delete all local settings and identity from this browser.")) {
            localStorage.clear();
            window.location.href = '/';
        }
    },

    exportData: function() {
        const data = { 
            chatify_backup: {
                user: State.user, 
                settings: State.settings, 
                trusted: State.trustedPeers, 
                version: "13.0.2"
            },
            exportedAt: new Date().toISOString() 
        };
        const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatify_backup_${State.user.name.toLowerCase()}.json`;
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
                if(reg.trusted) localStorage.setItem('chatify_trusted', JSON.stringify(reg.trusted));
                if(reg.user) localStorage.setItem('chatify_user', JSON.stringify(reg.user));
                alert("Backup restored successfully. Reloading...");
                location.reload();
            } catch(err) { alert("Invalid backup file."); }
        };
        reader.readAsText(file);
    }
};

window.Settings = Settings;
