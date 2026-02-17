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
            channels.forEach((c) => {
                const isActive = State.activeChannel === c.id;
                const div = document.createElement('div');
                div.className = `flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-300 group ${isActive ? 'bg-white dark:bg-white/10 shadow-soft scale-[1.02] nav-item-active' : 'hover:bg-white/50 dark:hover:bg-white/5'}`;
                if (isActive) div.setAttribute('aria-current', 'page');
                
                div.onclick = () => Chat.load(c.id, c.name);
                
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}">
                            <i data-lucide="hash" class="w-4 h-4"></i>
                        </div>
                        <span class="text-sm font-bold ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'} hidden lg:block">${c.name}</span>
                    </div>
                    ${isActive ? '<div class="w-1.5 h-1.5 bg-black dark:bg-white rounded-full hidden lg:block"></div>' : ''}
                `;
                cList.appendChild(div);
            });
            if(window.lucide) lucide.createIcons();
        } catch(e) {}
    },

    renderUsers: async function() {
        const uList = document.getElementById('user-list');
        const mList = document.getElementById('member-list-sidebar');
        const countEl = document.getElementById('online-count-total');
        if(!uList || !State.user) return;

        try {
            const users = await API.getUsers();
            uList.innerHTML = '';
            if(mList) mList.innerHTML = '';

            const otherUsers = users.filter(u => (u.uid || u.id) !== State.user.uid);
            if(countEl) countEl.innerText = users.length;

            // Render DMs
            otherUsers.forEach((u) => {
                const uid = u.uid || u.id;
                const dmId = [State.user.uid, uid].sort().join('_');
                const isActive = State.activeChannel === dmId;
                
                const div = document.createElement('div');
                div.className = `flex items-center gap-3 p-2 rounded-2xl cursor-pointer transition-all duration-300 group ${isActive ? 'bg-white dark:bg-white/10 shadow-soft nav-item-active' : 'hover:bg-white/50 dark:hover:bg-white/5'}`;
                if (isActive) div.setAttribute('aria-current', 'page');
                
                div.onclick = () => Chat.load(dmId, u.name);
                
                div.innerHTML = `
                    <div class="relative shrink-0">
                        <img src="${u.avatar}" class="w-8 h-8 rounded-xl object-cover bg-gray-200 shadow-sm group-hover:scale-105 transition-transform">
                        <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-white dark:bg-black rounded-full flex items-center justify-center">
                            <div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        </div>
                    </div>
                    <span class="text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'} truncate hidden lg:block">${u.name}</span>
                `;
                uList.appendChild(div);
            });

            // Render Member List (Right Sidebar)
            if(mList) {
                users.forEach(u => {
                    const div = document.createElement('div');
                    div.className = "flex items-center gap-2 p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group";
                    div.innerHTML = `
                        <div class="relative">
                            <img src="${u.avatar}" class="w-6 h-6 rounded-md object-cover bg-zinc-200">
                            <div class="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-white dark:border-zinc-900 rounded-full"></div>
                        </div>
                        <span class="text-xs font-medium text-zinc-500 group-hover:text-black dark:group-hover:text-white truncate">${u.name}</span>
                    `;
                    mList.appendChild(div);
                });
            }

            if(window.lucide) lucide.createIcons();
        } catch(e) {}
    }
};

window.Navigation = Navigation;
