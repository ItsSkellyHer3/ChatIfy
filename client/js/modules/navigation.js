import { State, toggleTrust } from '../state.js';
import { API } from '../api.js';
import { Chat } from '../chat.js';

export const Navigation = {
    collapsedCategories: new Set(),

    init: function() {
        this.renderLists();
    },

    toggleSidebar: function() {
        const sidebar = document.getElementById('sidebar-container');
        if(sidebar) sidebar.classList.toggle('hidden-mobile');
    },

    toggleCategory: function(cat) {
        const list = document.getElementById(`${cat}-list`) || document.getElementById(cat === 'channels' ? 'channel-list' : 'user-list');
        const isCollapsed = this.collapsedCategories.has(cat);
        if(isCollapsed) this.collapsedCategories.delete(cat); else this.collapsedCategories.add(cat);
        if(list) list.style.display = isCollapsed ? 'flex' : 'none';
    },

    renderLists: async function() {
        this.renderChannels();
        this.renderUsers();
    },

    renderChannels: async function() {
        const cList = document.getElementById('channel-list');
        if(!cList) return;

        try {
            const channels = await API.getChannels();
            cList.innerHTML = '';
            channels.forEach(c => {
                const isActive = State.activeChannel === c.id;
                const div = document.createElement('div');
                div.id = `channel-${c.id}`;
                div.className = `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}`;
                div.onclick = () => {
                    Chat.load(c.id, c.name, false);
                    this.renderLists(); // Refresh to update active state
                    if(window.innerWidth <= 1024) this.toggleSidebar();
                };
                div.innerHTML = `<i data-lucide="hash" class="w-4 h-4 opacity-70"></i> ${c.name}`;
                cList.appendChild(div);
            });
            if(window.lucide) lucide.createIcons();
        } catch(e) { console.error("[Nav] Room sync error:", e); }
    },

    renderUsers: async function() {
        const uList = document.getElementById('user-list');
        const onlineCount = document.getElementById('online-count');
        if(!uList || !State.user) return;

        try {
            const users = await API.getUsers();
            uList.innerHTML = '';
            const otherUsers = users.filter(u => (u.uid || u.id) !== State.user.uid);
            if(onlineCount) onlineCount.innerText = otherUsers.length;

            otherUsers.forEach(u => {
                const uid = u.uid || u.id;
                const dmId = [State.user.uid, uid].sort().join('_');
                const isActive = State.activeChannel === dmId;
                
                const div = document.createElement('div');
                div.id = `user-${uid}`;
                div.className = `flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}`;
                
                div.onclick = () => {
                    Chat.load(dmId, u.name, false);
                    this.renderLists();
                    if(window.innerWidth <= 1024) this.toggleSidebar();
                };

                div.innerHTML = `
                    <img src="${u.avatar}" class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 object-cover shadow-sm">
                    <span class="truncate flex-1">${u.name}</span>
                    <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                `;

                uList.appendChild(div);
            });
            if(window.lucide) lucide.createIcons();
        } catch(e) { console.error("[Nav] User sync error:", e); }
    }
};

window.Navigation = Navigation;
