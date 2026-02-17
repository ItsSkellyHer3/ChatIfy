import { State } from './state.js';
import { API } from './api.js';

export const Chat = {
    typingTimeout: null,
    isTyping: false,
    autoScroll: true,
    lastMsgUid: null,
    
    init: function() {
        const input = document.getElementById('msg-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.send();
                }
                this.handleTyping();
            });
            input.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
        this.startSystemMonitors();
    },

    load: async function(id, name = 'Overview', isReadOnly = false) {
        if(State.activeChannel && API.socket) API.socket.emit('leave', State.activeChannel);
        
        State.activeChannel = id;
        this.lastMsgUid = null;
        this.clearReply();
        
        const feed = document.getElementById('messages-feed');
        if (feed) feed.innerHTML = ''; 

        const inputArea = document.querySelector('main > div.p-6.pt-2');
        if (inputArea) {
            if (id === 'getting-started' || isReadOnly) {
                inputArea.classList.add('hidden');
            } else {
                inputArea.classList.remove('hidden');
            }
        }

        const roomLabels = document.querySelectorAll('#room-name, #context-room-name');
        roomLabels.forEach(el => el.innerText = name);

        if(id === 'getting-started') {
            this.renderOverview();
            return;
        }

        try {
            if(feed) feed.innerHTML = '<div class="flex items-center justify-center h-full opacity-20"><div class="w-8 h-8 border-2 border-t-black dark:border-t-white rounded-full animate-spin"></div></div>';
            
            const messages = await API.getMessages(id);
            if(feed) feed.innerHTML = '';

            if (messages.length === 0) {
                this.renderEmptyState();
            } else {
                messages.forEach(m => this.renderMessage(m, false));
                this.scrollToBottom(true);
            }
            
            if(API.socket && API.socket.connected) {
                API.socket.emit('join', id);
            }
            
            this.updateRoomData();
        } catch(e) {
            if(feed) feed.innerHTML = '<div class="text-center py-20 text-xs font-bold text-red-500 uppercase tracking-widest">Uplink Error</div>';
        }
    },

    renderOverview: function() {
        const feed = document.getElementById('messages-feed');
        if(!feed) return;
        
        feed.innerHTML = `
            <div class="max-w-3xl mx-auto w-full h-full flex flex-col items-center justify-center p-8 animate-fade-in">
                <div class="w-20 h-20 bg-black dark:bg-white rounded-[2rem] shadow-soft flex items-center justify-center mb-8">
                    <i data-lucide="zap" class="w-8 h-8 text-white dark:text-black"></i>
                </div>
                
                <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 text-center tracking-tight uppercase italic">
                    Infrastructure Ready.
                </h1>
                
                <p class="text-gray-500 text-center max-w-lg mb-12 text-lg font-medium leading-relaxed">
                    Ephemeral messaging is operational. Select a channel to begin.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <button onclick="document.querySelector('#channel-list > div')?.click()" class="group p-6 text-left bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[2rem] hover:shadow-soft transition-all hover:-translate-y-1">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
                                <i data-lucide="message-circle" class="w-6 h-6"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-5 h-5 text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors"></i>
                        </div>
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-1 uppercase tracking-tight italic">Channels</h3>
                        <p class="text-sm text-gray-500">Access primary threads.</p>
                    </button>

                    <button onclick="window.location.href='/settings.html'" class="group p-6 text-left bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[2rem] hover:shadow-soft transition-all hover:-translate-y-1">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-500 dark:text-white">
                                <i data-lucide="user" class="w-6 h-6"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-5 h-5 text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors"></i>
                        </div>
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-1 uppercase tracking-tight italic">Identity</h3>
                        <p class="text-sm text-gray-500">Configure credentials.</p>
                    </button>
                </div>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
    },

    renderEmptyState: function() {
        const feed = document.getElementById('messages-feed');
        if(feed) feed.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full opacity-20 space-y-4">
                <i data-lucide="layers" class="w-12 h-12"></i>
                <span class="text-[10px] font-black uppercase tracking-[0.4em]">Buffer Empty</span>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
    },

    handleTyping: function() {
        if (!State.activeChannel) return;
        if (!this.isTyping) { this.isTyping = true; API.sendTyping(State.activeChannel, true); }
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            API.sendTyping(State.activeChannel, false);
        }, 2000);
    },

    send: function() {
        const input = document.getElementById('msg-input');
        const text = input.value.trim();
        if (!text || !State.activeChannel) return;

        input.value = '';
        input.style.height = 'auto';
        
        const nonce = 'temp-' + Date.now();
        this.renderMessage({
            id: nonce, uid: State.user.uid, name: State.user.name, avatar: State.user.avatar,
            text: text, ts: new Date().toISOString(), isTemp: true, reply_to: State.replyingTo
        }, true);
        
        API.sendMessage(State.activeChannel, text, nonce, State.replyingTo);
        this.clearReply();
    },

    renderMessage: function(m, animate = true) {
        const feed = document.getElementById('messages-feed');
        if (!feed) return;

        if (!m.isTemp && m.nonce) {
            const temp = document.getElementById(m.nonce);
            if(temp) temp.remove();
        }

        if (document.getElementById(m.id)) return;

        const isOwn = m.uid === State.user.uid;
        const isGrouped = this.lastMsgUid === m.uid && !m.reply_to;
        this.lastMsgUid = m.uid;

        const msgEl = document.createElement('div');
        msgEl.id = m.id;
        msgEl.className = `flex w-full ${isGrouped ? 'mt-1' : 'mt-6'} ${isOwn ? 'justify-end' : 'justify-start'} group relative px-4 md:px-0`;

        const time = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let replyHtml = '';
        if (m.reply_to) {
            replyHtml = `
                <div class="flex items-center gap-2 mb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-tighter ${isOwn ? 'mr-4' : 'ml-12'}">
                    <i data-lucide="corner-down-right" class="w-3.5 h-3.5"></i>
                    <span>${m.reply_to.name}</span>
                    <span class="truncate max-w-[150px] normal-case font-medium opacity-50 italic">"${m.reply_to.text}"</span>
                </div>
            `;
        }

        const bubbleClass = isOwn 
            ? "bg-black text-white dark:bg-white dark:text-black rounded-[1.5rem] rounded-tr-md shadow-lg" 
            : "bg-gray-100 text-black dark:bg-zinc-900 dark:text-white rounded-[1.5rem] rounded-tl-md";

        const avatarHtml = (!isOwn && !isGrouped) ? `
            <img src="${m.avatar}" class="w-8 h-8 rounded-xl object-cover mr-3 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" onclick="Chat.showPopover(event, '${m.uid}', '${m.name}', '${m.avatar}')">
        ` : (!isOwn && isGrouped) ? `<div class="w-8 mr-3"></div>` : '';

        const nameHtml = (!isOwn && !isGrouped) ? `
            <div class="flex items-baseline gap-2 mb-1 ml-1">
                <span class="text-[11px] font-black text-gray-900 dark:text-white uppercase italic tracking-tight">${m.name}</span>
                <span class="text-[9px] font-bold text-gray-400 uppercase">${time}</span>
            </div>
        ` : '';

        msgEl.innerHTML = `
            <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] lg:max-w-[75%] relative">
                ${replyHtml}
                <div class="flex items-end group/inner relative">
                    ${avatarHtml}
                    <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'}">
                        ${nameHtml}
                        <div class="${bubbleClass} px-5 py-3 text-[14px] font-medium leading-relaxed relative overflow-hidden">
                            ${this.formatText(m.text)}
                            ${m.isTemp ? '<span class="absolute bottom-0 left-0 w-full h-[2px] bg-black/10 dark:bg-white/10 animate-pulse"></span>' : ''}
                        </div>
                        <div id="reactions-${m.id}" class="flex flex-wrap gap-1 mt-1 empty:hidden">
                            ${this.renderReactions(m.reactions, m.id)}
                        </div>
                    </div>

                    <!-- Modern Action Dock (Inside Layout) -->
                    <div class="flex gap-1 items-center px-2 py-1 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-xl border border-black/5 dark:border-white/5 opacity-0 group-hover/inner:opacity-100 transition-all duration-200 absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} z-30">
                        <button onclick="Chat.initReply('${m.id}', '${m.name}', '${this.escapeHtml(m.text)}')" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-500 hover:text-black dark:hover:text-white" aria-label="Reply to message">
                            <i data-lucide="reply" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="API.addReaction('${m.id}', '❤️')" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-500 hover:text-red-500" aria-label="React with heart">
                            <i data-lucide="heart" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        feed.appendChild(msgEl);
        if(window.lucide) lucide.createIcons();
        if (animate) gsap.from(msgEl, { opacity: 0, y: 10, duration: 0.3, ease: "power2.out" });
        this.scrollToBottom();
    },

    formatText: function(text) {
        const div = document.createElement('div');
        div.innerText = text;
        let safe = div.innerHTML;
        safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/`([^`]+)`/g, '<code class="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded font-mono text-[12px]">$1</code>');
        return safe;
    },

    escapeHtml: function(str) { return str.replace(/'/g, "\\'"); },

    scrollToBottom: function(force = false) {
        const feed = document.getElementById('messages-feed');
        if (feed && (this.autoScroll || force)) {
            feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
        }
    },

    initReply: function(id, name, text) {
        State.replyingTo = { id, name, text: text.substring(0, 60) };
        const preview = document.getElementById('reply-preview');
        if (preview) {
            preview.innerHTML = `
                <div class="flex items-center justify-between p-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl shadow-2xl animate-fade-in relative z-50">
                    <div class="flex items-center gap-4 overflow-hidden pl-3 border-l-4 border-black dark:border-white">
                        <div class="flex flex-col min-w-0">
                            <span class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Capture Context</span>
                            <span class="text-xs truncate font-bold text-gray-600 dark:text-gray-300">"${text}"</span>
                        </div>
                    </div>
                    <button onclick="Chat.clearReply()" class="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:rotate-90 transition-transform">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            if(window.lucide) lucide.createIcons();
            preview.classList.remove('hidden');
            gsap.fromTo(preview, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)" });
        }
        document.getElementById('msg-input')?.focus();
    },

    clearReply: function() {
        State.replyingTo = null;
        const preview = document.getElementById('reply-preview');
        if(preview) preview.classList.add('hidden');
    },

    updateRoomData: async function() {
        try {
            const users = await API.getUsers();
            document.querySelectorAll('#online-count, #stat-members').forEach(el => el.innerText = users.length);
        } catch(e) {}
    },

    startSystemMonitors: function() {
        setInterval(() => {
            const p = [12, 18, 9, 24, 15][Math.floor(Math.random() * 5)];
            const el = document.getElementById('stat-ping');
            if(el) el.innerText = p + 'ms';
        }, 3000);
    },

    showPopover: function(e, uid, name, avatar) {
        e.stopPropagation();
        const pop = document.getElementById('user-popover');
        document.getElementById('popover-name').innerText = name;
        document.getElementById('popover-avatar').src = avatar;
        const x = Math.min(e.pageX, window.innerWidth - 320);
        const y = Math.min(e.pageY, window.innerHeight - 400);
        gsap.set(pop, { display: 'block', left: x, top: y, opacity: 0, scale: 0.9 });
        gsap.to(pop, { opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" });
        const close = () => { gsap.to(pop, { opacity: 0, scale: 0.9, duration: 0.2, onComplete: () => pop.style.display = 'none' }); document.removeEventListener('click', close); };
        setTimeout(() => document.addEventListener('click', close), 10);
    },

    onMessage: function(msg) { if (msg.channelId === State.activeChannel) this.renderMessage(msg, true); },
    onReactionUpdate: function(data) {
        const container = document.getElementById(`reactions-${data.mid}`);
        if(container) container.innerHTML = this.renderReactions(data.reactions, data.mid);
    },
    renderReactions: function(reactions, mid) {
        if (!reactions || Object.keys(reactions).length === 0) return '';
        return Object.entries(reactions).map(([emoji, uids]) => `
            <button onclick="API.addReaction('${mid}', '${emoji}')" class="px-2 py-0.5 bg-white dark:bg-white/10 border border-black/5 dark:border-white/5 rounded-full text-[10px] font-bold shadow-sm hover:scale-110 transition-transform" aria-label="${uids.length} reactions with ${emoji}">
                ${emoji} <span class="text-gray-500 ml-0.5">${uids.length}</span>
            </button>
        `).join('');
    }
};

window.Chat = Chat;
