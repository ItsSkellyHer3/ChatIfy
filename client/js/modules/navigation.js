import { State } from '../state.js';
import { API } from '../api.js';
import { Chat } from '../chat.js';

export const Navigation = {
    init: function() {
        this.renderLists();
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
                div.className = `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all cursor-pointer ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-black dark:hover:text-white group'}`;
                div.onclick = () => Chat.load(c.id, c.name);
                div.innerHTML = `<i data-lucide="hash" class="w-5 h-5 opacity-70"></i> <span class="hidden lg:block text-sm font-bold tracking-tight">${c.name}</span>`;
                cList.appendChild(div);
            });
            if(window.lucide) lucide.createIcons();
        } catch(e) {}
    },

    renderUsers: async function() {
        const uList = document.getElementById('user-list');
        const countEl = document.getElementById('online-count');
        if(!uList || !State.user) return;

        try {
            const users = await API.getUsers();
            uList.innerHTML = '';
            const otherUsers = users.filter(u => (u.uid || u.id) !== State.user.uid);
            if(countEl) countEl.innerText = otherUsers.length;

            otherUsers.forEach(u => {
                const uid = u.uid || u.id;
                const dmId = [State.user.uid, uid].sort().join('_');
                const isActive = State.activeChannel === dmId;
                
                const div = document.createElement('div');
                div.className = `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all cursor-pointer ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-black dark:hover:text-white group'}`;
                div.onclick = () => Chat.load(dmId, u.name);
                div.innerHTML = `
                    <img src="${u.avatar}" class="w-5 h-5 rounded-lg object-cover shadow-sm grayscale group-hover:grayscale-0 transition-all">
                    <span class="hidden lg:block text-sm font-bold truncate tracking-tight">${u.name}</span>
                `;
                uList.appendChild(div);
            });
            if(window.lucide) lucide.createIcons();
        } catch(e) {}
    }
};

window.Navigation = Navigation;
