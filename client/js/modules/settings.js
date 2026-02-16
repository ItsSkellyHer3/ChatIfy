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
                btn.classList.add('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black', 'shadow-xl');
                btn.classList.remove('hover:bg-zinc-100', 'dark:hover:bg-zinc-900', 'text-zinc-500');
            } else {
                btn.classList.remove('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black', 'shadow-xl');
                btn.classList.add('hover:bg-zinc-100', 'dark:hover:bg-zinc-900', 'text-zinc-500');
            }
        });

        const s = State.settings;
        let html = '';

        const h1 = "text-4xl font-black tracking-tighter uppercase italic mb-2";
        const p = "text-sm font-bold text-zinc-400 uppercase tracking-widest mb-12";
        const card = "bg-white dark:bg-black border-thin border-zinc-100 dark:border-zinc-900 rounded-[2.5rem] p-8 lg:p-12 mb-8 transition-all hover:border-zinc-200 dark:hover:border-zinc-800";
        const label = "text-[10px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.3em] mb-3 block";

        if(tab === 'profile') {
            html = `
                <div class="animate-fade-in">
                    <h1 class="${h1}">Identity</h1>
                    <p class="${p}">Protocol configuration for public profile.</p>
                    
                    <div class="${card} space-y-10">
                        <div class="flex flex-col md:flex-row items-center gap-10">
                            <div class="relative group">
                                <img id="settings-avatar-preview" src="${State.user.avatar}" class="w-32 h-32 rounded-[3rem] border-thin border-zinc-100 dark:border-zinc-800 object-cover shadow-2xl transition-transform group-hover:scale-105">
                                <button onclick="Settings.randomizeProfile()" class="absolute -bottom-2 -right-2 bg-black dark:bg-white text-white dark:text-black p-3 rounded-2xl shadow-xl hover:rotate-12 transition-transform">
                                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                </button>
                            </div>
                            
                            <div class="flex-1 w-full space-y-6">
                                <div class="space-y-2">
                                    <label class="${label}">Designation</label>
                                    <input type="text" id="settings-username" value="${State.user.name}" class="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-thin border-zinc-100 dark:border-zinc-900 rounded-2xl focus:border-black dark:focus:border-white outline-none text-black dark:text-white font-black text-xl transition-all">
                                </div>
                                <button onclick="Settings.saveProfile()" class="w-full md:w-auto px-10 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl">
                                    Update Identity
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
                    <p class="${p}">Security and preference management.</p>
                    
                    <div class="space-y-4">
                        <div class="${card} flex items-center justify-between group">
                            <div class="space-y-1">
                                <h4 class="font-black text-lg uppercase italic">Audio Alerts</h4>
                                <p class="text-xs font-bold text-zinc-400">Incoming message notifications.</p>
                            </div>
                            <input type="checkbox" onchange="Settings.saveSetting('sounds', this.checked)" ${s.sounds ? 'checked' : ''} class="w-6 h-6 accent-black dark:accent-white cursor-pointer">
                        </div>

                        <div class="${card} flex items-center justify-between group">
                            <div class="space-y-1">
                                <h4 class="font-black text-lg uppercase italic">Privacy Blur</h4>
                                <p class="text-xs font-bold text-zinc-400">Obfuscate feed when inactive.</p>
                            </div>
                            <input type="checkbox" onchange="Settings.saveSetting('privacyBlur', this.checked)" ${s.privacyBlur ? 'checked' : ''} class="w-6 h-6 accent-black dark:accent-white cursor-pointer">
                        </div>

                        <div class="${card} flex items-center justify-between group">
                            <div class="space-y-1">
                                <h4 class="font-black text-lg uppercase italic">Stealth Protocol</h4>
                                <p class="text-xs font-bold text-zinc-400">Minimize UI elements visibility.</p>
                            </div>
                            <input type="checkbox" onchange="Settings.saveSetting('stealthMode', this.checked)" ${s.stealthMode ? 'checked' : ''} class="w-6 h-6 accent-black dark:accent-white cursor-pointer">
                        </div>
                    </div>
                </div>
            `;
        } else if(tab === 'theme') {
            html = `
                <div class="animate-fade-in">
                    <h1 class="${h1}">Appearance</h1>
                    <p class="${p}">Visual layer configuration.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="${card}">
                            <label class="${label}">Environment</label>
                            <div class="grid grid-cols-2 gap-4">
                                <button onclick="Settings.saveSetting('theme', 'onyx')" class="group text-center space-y-3">
                                    <div class="aspect-square bg-black border-2 rounded-[2rem] flex items-center justify-center transition-all ${s.theme === 'onyx' ? 'border-zinc-400 shadow-2xl scale-105' : 'border-zinc-100 dark:border-zinc-900 opacity-50'}">
                                        <div class="w-6 h-6 bg-white rounded-full"></div>
                                    </div>
                                    <span class="text-[10px] font-black uppercase tracking-widest ${s.theme === 'onyx' ? 'text-black dark:text-white' : 'text-zinc-400'}">Onyx</span>
                                </button>
                                <button onclick="Settings.saveSetting('theme', 'pearl')" class="group text-center space-y-3">
                                    <div class="aspect-square bg-white border-2 rounded-[2rem] flex items-center justify-center transition-all ${s.theme === 'pearl' ? 'border-black shadow-2xl scale-105' : 'border-zinc-100 dark:border-zinc-900 opacity-50'}">
                                        <div class="w-6 h-6 bg-black rounded-full"></div>
                                    </div>
                                    <span class="text-[10px] font-black uppercase tracking-widest ${s.theme === 'pearl' ? 'text-black dark:text-white' : 'text-zinc-400'}">Pearl</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="${card}">
                            <label class="${label}">Layout Density</label>
                            <div class="space-y-3">
                                ${['Comfortable', 'Compact'].map(sz => `
                                    <button onclick="Settings.saveSetting('fontSize', '${sz.toLowerCase()}')" class="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${s.fontSize === sz.toLowerCase() ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl' : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-400 hover:bg-zinc-100'}">
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
                    <p class="${p}">Core data and archive management.</p>
                    
                    <div class="${card} text-center py-16 space-y-8">
                        <div class="w-24 h-24 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                            <i data-lucide="database" class="w-10 h-10 text-zinc-300"></i>
                        </div>
                        <p class="text-xs font-bold text-zinc-400 max-w-sm mx-auto leading-relaxed uppercase tracking-tighter">Identity archives contain name, avatar, and preference states. History is not persistent.</p>
                        
                        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onclick="Settings.exportData()" class="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl">
                                Export Archive
                            </button>
                            <label class="px-8 py-4 bg-zinc-50 dark:bg-zinc-900 border-thin border-zinc-100 dark:border-zinc-800 text-black dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                                Import Archive
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
