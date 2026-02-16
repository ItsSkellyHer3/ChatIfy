import { State } from './state.js';
import { API } from './api.js';

export const Chat = {
    typingTimeout: null,
    isTyping: false,
    autoScroll: true,
    
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
        }
        this.startSystemMonitors();
    },

    load: async function(id, name = 'General', isReadOnly = false) {
        if(State.activeChannel && API.socket) {
            API.socket.emit('leave', State.activeChannel);
        }
        
        State.activeChannel = id;
        
        // Header Sync
        const roomLabels = document.querySelectorAll('#room-name, #context-room-name');
        roomLabels.forEach(el => el.innerText = name);

        const feed = document.getElementById('messages-feed');
        if (feed) {
            feed.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full space-y-6 opacity-20">
                    <div class="w-12 h-12 bg-black dark:bg-white rounded-2xl animate-spin"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.4em]">Establishing Uplink</span>
                </div>
            `;
        }

        if(id === 'getting-started') {
            this.renderOverview();
            return;
        }

        try {
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
            if(feed) feed.innerHTML = '<div class="text-center py-20 text-xs font-black uppercase tracking-widest text-red-500">Buffer_Sync_Error</div>';
        }
    },

    renderOverview: function() {
        const feed = document.getElementById('messages-feed');
        if(!feed) return;
        
        feed.innerHTML = `
            <div class="max-w-5xl mx-auto w-full h-full flex flex-col items-center justify-center p-12">
                <div class="w-24 h-24 bg-black dark:bg-white rounded-[2.5rem] flex items-center justify-center mb-12 shadow-2xl reveal-up">
                    <i data-lucide="zap" class="w-10 h-10 text-white dark:text-black"></i>
                </div>
                
                <h1 class="text-6xl md:text-[5rem] font-black text-black dark:text-white mb-8 text-center tracking-tighter uppercase italic leading-none reveal-up">
                    Workspace<br>Active.
                </h1>
                
                <p class="text-zinc-400 dark:text-zinc-600 text-center max-w-xl mb-16 text-xl font-medium leading-relaxed reveal-up">
                    Encryption layer verified. Select a transmission thread from the sidebar to begin coordination.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                    <button onclick="document.querySelector('#channel-list > div')?.click()" class="reveal-up group p-10 text-left bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-[3rem] transition-all hover:bg-black dark:hover:bg-white hover:border-black dark:hover:border-white shadow-xl">
                        <div class="flex items-center justify-between mb-8">
                            <div class="w-14 h-14 rounded-2xl bg-white dark:bg-black flex items-center justify-center text-black dark:text-white border border-zinc-100 dark:border-zinc-800 group-hover:scale-110 transition-transform">
                                <i data-lucide="message-square" class="w-6 h-6"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-6 h-6 text-zinc-300 group-hover:text-white dark:group-hover:text-black transition-colors"></i>
                        </div>
                        <h3 class="font-black text-2xl text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-2 uppercase italic tracking-tighter">Enter General</h3>
                        <p class="text-sm text-zinc-500 group-hover:text-zinc-400 dark:group-hover:text-zinc-600">Join the primary transmission.</p>
                    </button>

                    <button onclick="window.location.href='/settings.html'" class="reveal-up group p-10 text-left bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-[3rem] transition-all hover:bg-black dark:hover:bg-white hover:border-black dark:hover:border-white shadow-xl">
                        <div class="flex items-center justify-between mb-8">
                            <div class="w-14 h-14 rounded-2xl bg-white dark:bg-black flex items-center justify-center text-black dark:text-white border border-zinc-100 dark:border-zinc-800 group-hover:scale-110 transition-transform">
                                <i data-lucide="fingerprint" class="w-6 h-6"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-6 h-6 text-zinc-300 group-hover:text-white dark:group-hover:text-black transition-colors"></i>
                        </div>
                        <h3 class="font-black text-2xl text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-2 uppercase italic tracking-tighter">Identity</h3>
                        <p class="text-sm text-zinc-500 group-hover:text-zinc-400 dark:group-hover:text-zinc-600">Configure public credentials.</p>
                    </button>
                </div>
            </div>
        `;
        
        gsap.from("#messages-feed .reveal-up", { opacity: 0, y: 30, stagger: 0.1, duration: 0.8, ease: "power4.out" });
        if(window.lucide) lucide.createIcons();
    },

    renderEmptyState: function() {
        const feed = document.getElementById('messages-feed');
        if(feed) feed.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full opacity-20 space-y-4">
                <i data-lucide="ghost" class="w-16 h-16 text-black dark:text-white"></i>
                <span class="text-xs font-black uppercase tracking-[0.5em]">Null_Buffer</span>
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
        const msgEl = document.createElement('div');
        msgEl.id = m.id;
        msgEl.className = `flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'} group`;

        const time = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let replyHtml = '';
        if (m.reply_to) {
            replyHtml = `
                <div class="flex items-center gap-2 mb-1.5 text-[9px] font-black text-zinc-400 dark:text-zinc-700 uppercase tracking-tighter ${isOwn ? 'mr-4' : 'ml-14'}">
                    <i data-lucide="corner-down-right" class="w-3.5 h-3.5"></i>
                    <span>${m.reply_to.name}</span>
                    <span class="truncate max-w-[120px] normal-case font-medium opacity-50 italic">"${m.reply_to.text}"</span>
                </div>
            `;
        }

        const bubbleClass = isOwn 
            ? "bg-black text-white dark:bg-white dark:text-black rounded-[2rem] rounded-tr-md shadow-xl" 
            : "bg-zinc-50 text-black dark:bg-zinc-950 dark:text-white border border-zinc-100 dark:border-zinc-900 rounded-[2rem] rounded-tl-md";

        msgEl.innerHTML = `
            <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] lg:max-w-[75%]">
                ${replyHtml}
                <div class="flex items-end gap-4">
                    ${!isOwn ? `<img src="${m.avatar}" class="w-9 h-9 rounded-2xl object-cover mb-1 shrink-0 border border-zinc-100 dark:border-zinc-900 shadow-sm cursor-pointer hover:scale-110 transition-transform" onclick="Chat.showPopover(event, '${m.uid}', '${m.name}', '${m.avatar}')">` : ''}
                    
                    <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'}">
                        <div class="${bubbleClass} px-7 py-4 text-[15px] font-medium leading-relaxed relative overflow-hidden">
                            ${this.formatText(m.text)}
                            ${m.isTemp ? '<div class="absolute bottom-0 left-0 w-full h-[2px] bg-white/20 dark:bg-black/20 animate-pulse"></div>' : ''}
                        </div>
                        
                        <div class="flex items-center gap-4 mt-2 px-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <span class="text-[10px] font-black text-zinc-300 dark:text-zinc-800 uppercase tracking-[0.2em]">${time}</span>
                            <div id="reactions-${m.id}" class="flex gap-1.5">
                                ${this.renderReactions(m.reactions, m.id)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-all justify-center">
                <button onclick="Chat.initReply('${m.id}', '${m.name}', '${this.escapeHtml(m.text)}')" class="p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-black dark:hover:text-white transition-all">
                    <i data-lucide="reply" class="w-4 h-4"></i>
                </button>
                <button onclick="API.addReaction('${m.id}', '❤️')" class="p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-red-500 transition-all">
                    <i data-lucide="heart" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        feed.appendChild(msgEl);
        if(window.lucide) lucide.createIcons();
        
        if (animate) {
            gsap.from(msgEl, { opacity: 0, x: isOwn ? 30 : -30, duration: 0.5, ease: "power4.out" });
        }
        
        this.scrollToBottom();
    },

    formatText: function(text) {
        const div = document.createElement('div');
        div.innerText = text;
        let safe = div.innerHTML;
        safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/`([^`]+)`/g, '<code class="bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-lg font-mono text-[12px] border border-black/5 dark:border-white/5">$1</code>');
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
        State.replyingTo = { id, name, text: text.substring(0, 50) };
        const preview = document.getElementById('reply-preview');
        if (preview) {
            preview.innerHTML = `
                <div class="flex items-center justify-between p-5 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-100 dark:border-zinc-900 rounded-[2rem] shadow-2xl animate-slide-in-right">
                    <div class="flex items-center gap-5 overflow-hidden pl-3 border-l-4 border-black dark:border-white">
                        <div class="flex flex-col min-w-0">
                            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Context Capture</span>
                            <span class="text-sm font-bold text-black dark:text-white truncate">"${text}"</span>
                        </div>
                    </div>
                    <button onclick="Chat.clearReply()" class="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-full hover:rotate-90 transition-transform duration-300">
                        <i data-lucide="x" class="w-4 h-4 text-zinc-500"></i>
                    </button>
                </div>
            `;
            if(window.lucide) lucide.createIcons();
            preview.classList.remove('hidden');
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
            const countLabels = document.querySelectorAll('#online-count, #stat-users');
            countLabels.forEach(el => el.innerText = users.length);
        } catch(e) {}
    },

    startSystemMonitors: function() {
        setInterval(() => {
            const pings = [11, 14, 9, 12, 18, 15];
            const p = pings[Math.floor(Math.random() * pings.length)];
            const el = document.getElementById('stat-ping');
            if(el) el.innerText = p + 'ms';
        }, 5000);
    },

    showPopover: function(e, uid, name, avatar) {
        e.stopPropagation();
        const pop = document.getElementById('user-popover');
        document.getElementById('popover-name').innerText = name;
        document.getElementById('popover-avatar').src = avatar;
        
        gsap.set(pop, { display: 'block', x: Math.min(e.pageX, window.innerWidth - 400), y: Math.min(e.pageY, window.innerHeight - 500), opacity: 0, scale: 0.95 });
        gsap.to(pop, { opacity: 1, scale: 1, duration: 0.4, ease: "power4.out" });

        const close = () => { 
            gsap.to(pop, { opacity: 0, scale: 0.95, duration: 0.2, onComplete: () => pop.style.display = 'none' });
            document.removeEventListener('click', close); 
        };
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
            <button onclick="API.addReaction('${mid}', '${emoji}')" class="flex items-center gap-2 px-2.5 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full text-[10px] font-bold hover:scale-110 transition-transform">
                <span>${emoji}</span>
                <span class="text-zinc-500">${uids.length}</span>
            </button>
        `).join('');
    }
};

window.Chat = Chat;
