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
        const icon = document.querySelector(`.category-header[onclick*="${cat}"] i`);
        
        const isCollapsed = this.collapsedCategories.has(cat);
        if(isCollapsed) {
            this.collapsedCategories.delete(cat);
            if(list) {
                list.style.display = 'flex';
                list.classList.add('animate-fade');
            }
            if(icon) icon.style.transform = 'rotate(0deg)';
        } else {
            this.collapsedCategories.add(cat);
            if(list) list.style.display = 'none';
            if(icon) icon.style.transform = 'rotate(-90deg)';
        }
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
                div.className = `nav-item hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-gray-100 dark:bg-white/10 text-black dark:text-white' : 'text-gray-600 dark:text-gray-300'} flex items-center gap-3 cursor-pointer transition-colors`;
                div.onclick = () => {
                    Chat.load(c.id, c.name, false);
                    this.updateActiveNav(`channel-${c.id}`);
                    if(window.innerWidth <= 1024) this.toggleSidebar();
                };
                div.innerHTML = `<i data-lucide="hash" class="w-4 h-4 text-gray-400"></i> ${c.name}`;
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
                const isTrusted = State.trustedPeers.includes(uid);
                const dmId = [State.user.uid, uid].sort().join('_');
                const isActive = State.activeChannel === dmId;
                
                const div = document.createElement('div');
                div.id = `user-${uid}`;
                div.className = `nav-item hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg px-3 py-2 cursor-pointer transition-colors group ${isActive ? 'bg-gray-100 dark:bg-white/10' : ''}`;
                
                div.onclick = () => {
                    Chat.load(dmId, u.name, false);
                    if(window.innerWidth <= 1024) this.toggleSidebar();
                };

                const badgeHtml = isTrusted ? '<i data-lucide="shield-check" class="w-3 h-3 text-green-500 ml-auto"></i>' : '<div class="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>';

                div.innerHTML = `
                    <div class="flex items-center gap-3 w-full">
                        <div class="relative shrink-0">
                            <img src="${u.avatar}" class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 object-cover">
                        </div>
                        <span class="text-sm font-medium ${isActive ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-300'} truncate">${u.name}</span>
                        ${badgeHtml}
                    </div>
                `;

                uList.appendChild(div);
            });
            if(window.lucide) lucide.createIcons();
        } catch(e) { console.error("[Nav] User sync error:", e); }
    },

    updateActiveNav: function(activeId) {
        // Reset specific active classes if needed, but the render logic handles it mostly.
        // This is a simple implementation for channel switching highlight without re-render.
        const current = document.querySelector('.nav-item.bg-gray-100'); 
        if(current) {
             current.classList.remove('bg-gray-100', 'dark:bg-white/10', 'text-black', 'dark:text-white');
             current.classList.add('text-gray-600', 'dark:text-gray-300');
        }
        
        const active = document.getElementById(activeId);
        if(active) {
            active.classList.remove('text-gray-600', 'dark:text-gray-300');
            active.classList.add('bg-gray-100', 'dark:bg-white/10', 'text-black', 'dark:text-white');
        }
    }
};

window.Navigation = Navigation;
