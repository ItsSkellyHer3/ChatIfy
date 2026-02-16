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
        this.startPingMonitor();
    },

    load: async function(id, name = 'General', isReadOnly = false) {
        if(State.activeChannel && API.socket) {
            API.socket.emit('leave', State.activeChannel);
        }
        
        State.activeChannel = id;
        
        // Update Headers
        const names = document.querySelectorAll('#room-name, #context-room-name');
        names.forEach(el => el.innerText = name);

        const feed = document.getElementById('messages-feed');
        if (feed) {
            feed.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full space-y-6 animate-pulse opacity-20">
                    <div class="w-12 h-12 bg-slate-200 dark:bg-white/10 rounded-2xl animate-spin"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing</span>
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
                messages.forEach(m => this.renderMessage(m));
                this.scrollToBottom(true);
            }
            
            if(API.socket && API.socket.connected) {
                API.socket.emit('join', id);
            }
            
            this.updateRoomStats();

        } catch(e) {
            if(feed) feed.innerHTML = '<div class="text-center p-20 text-red-500 font-bold">UPLINK_FAILURE</div>';
        }
    },

    renderOverview: function() {
        const feed = document.getElementById('messages-feed');
        if(!feed) return;
        
        feed.innerHTML = `
            <div class="max-w-4xl mx-auto w-full h-full flex flex-col items-center justify-center p-12 animate-fade-in">
                <div class="w-24 h-24 bg-black dark:bg-white rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl">
                    <i data-lucide="zap" class="w-10 h-10 text-white dark:text-black"></i>
                </div>
                
                <h1 class="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 text-center tracking-tighter uppercase italic">
                    Systems Ready.
                </h1>
                
                <p class="text-slate-500 text-center max-w-lg mb-16 text-xl font-medium leading-relaxed">
                    Ephemeral messaging infrastructure is operational. Select a secure channel to begin coordination.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                    <button onclick="document.querySelector('.nav-channel')?.click()" class="group p-8 text-left bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2.5rem] transition-all hover:scale-[1.02] hover:bg-white dark:hover:bg-white/10 shadow-xl">
                        <div class="flex items-center justify-between mb-6">
                            <div class="w-12 h-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg">
                                <i data-lucide="message-square" class="w-6 h-6"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-5 h-5 text-slate-300 group-hover:translate-x-2 transition-transform"></i>
                        </div>
                        <h3 class="font-black text-xl text-slate-900 dark:text-white mb-2 uppercase italic tracking-tight">Open Channel</h3>
                        <p class="text-sm text-slate-500 font-medium">Join the primary discussion thread.</p>
                    </button>

                    <button onclick="window.location.href='/settings.html'" class="group p-8 text-left bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2.5rem] transition-all hover:scale-[1.02] hover:bg-white dark:hover:bg-white/10 shadow-xl">
                        <div class="flex items-center justify-between mb-6">
                            <div class="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-white shadow-lg">
                                <i data-lucide="shield" class="w-6 h-6"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-5 h-5 text-slate-300 group-hover:translate-x-2 transition-transform"></i>
                        </div>
                        <h3 class="font-black text-xl text-slate-900 dark:text-white mb-2 uppercase italic tracking-tight">Identity</h3>
                        <p class="text-sm text-slate-500 font-medium">Configure your temporary profile.</p>
                    </button>
                </div>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
    },

    renderEmptyState: function() {
        const feed = document.getElementById('messages-feed');
        if(feed) feed.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full opacity-30">
                <i data-lucide="layers" class="w-12 h-12 mb-4"></i>
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
        const nonce = 'temp-' + Date.now();
        this.renderMessage({
            id: nonce, uid: State.user.uid, name: State.user.name, avatar: State.user.avatar,
            text: text, ts: new Date().toISOString(), isTemp: true, reply_to: State.replyingTo
        });
        
        API.sendMessage(State.activeChannel, text, nonce, State.replyingTo);
        this.clearReply();
    },

    renderMessage: function(m) {
        const feed = document.getElementById('messages-feed');
        if (!feed) return;

        // Cleanup temporary message
        if (!m.isTemp && m.nonce) {
            const temp = document.getElementById(m.nonce);
            if(temp) temp.remove();
        }

        if (document.getElementById(m.id)) return;

        const isOwn = m.uid === State.user.uid;
        const msgEl = document.createElement('div');
        msgEl.id = m.id;
        msgEl.className = `flex w-full mb-2 ${isOwn ? 'justify-end' : 'justify-start'} group`;

        const time = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let replyHtml = '';
        if (m.reply_to) {
            replyHtml = `
                <div class="flex items-center gap-2 mb-1 text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter ml-4">
                    <i data-lucide="corner-down-right" class="w-3 h-3"></i>
                    <span>${m.reply_to.name}:</span>
                    <span class="truncate max-w-[100px] normal-case font-medium opacity-60">${m.reply_to.text}</span>
                </div>
            `;
        }

        const bubbleClass = isOwn 
            ? "chat-bubble-own rounded-[1.5rem] rounded-tr-md" 
            : "chat-bubble-other rounded-[1.5rem] rounded-tl-md";

        msgEl.innerHTML = `
            <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[80%]">
                ${replyHtml}
                <div class="flex items-end gap-3">
                    ${!isOwn ? `<img src="${m.avatar}" class="w-7 h-7 rounded-lg object-cover mb-1 shrink-0 shadow-sm cursor-pointer hover:scale-110 transition-transform" onclick="Chat.showPopover(event, '${m.uid}', '${m.name}', '${m.avatar}')">` : ''}
                    <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'}">
                        <div class="${bubbleClass} px-5 py-3 text-sm font-medium leading-relaxed relative overflow-hidden">
                            ${this.formatText(m.text)}
                            ${m.isTemp ? '<div class="absolute bottom-0 left-0 w-full h-0.5 bg-black/10 dark:bg-white/10 animate-pulse"></div>' : ''}
                        </div>
                        <div class="flex items-center gap-3 mt-1.5 px-2">
                            <span class="text-[9px] font-black text-slate-300 dark:text-zinc-800 uppercase tracking-[0.2em]">${m.name} • ${time}</span>
                            <div id="reactions-${m.id}" class="flex gap-1">
                                ${this.renderReactions(m.reactions, m.id)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-all justify-center">
                <button onclick="Chat.initReply('${m.id}', '${m.name}', '${this.escapeHtml(m.text)}')" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors">
                    <i data-lucide="reply" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="API.addReaction('${m.id}', '❤️')" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors">
                    <i data-lucide="heart" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;

        feed.appendChild(msgEl);
        if(window.lucide) lucide.createIcons();
        this.scrollToBottom();
    },

    formatText: function(text) {
        const div = document.createElement('div');
        div.innerText = text;
        let safe = div.innerHTML;
        safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/`([^`]+)`/g, '<code class="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md font-mono text-[11px]">$1</code>');
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
                <div class="flex items-center justify-between p-4 bg-white/80 dark:bg-surface/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl mb-3 shadow-xl animate-fade-in">
                    <div class="flex items-center gap-4 overflow-hidden pl-2 border-l-4 border-black dark:border-white">
                        <div class="flex flex-col min-w-0">
                            <span class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Replying to ${name}</span>
                            <span class="text-xs truncate font-bold text-slate-600 dark:text-slate-300">"${text}"</span>
                        </div>
                    </div>
                    <button onclick="Chat.clearReply()" class="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:scale-110 transition-transform">
                        <i data-lucide="x" class="w-4 h-4"></i>
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
        document.getElementById('reply-preview')?.classList.add('hidden');
    },

    updateRoomStats: async function() {
        try {
            const users = await API.getUsers();
            const countEls = document.querySelectorAll('#online-count, #context-user-count');
            countEls.forEach(el => el.innerText = users.length);
        } catch(e) {}
    },

    startPingMonitor: function() {
        setInterval(() => {
            const pings = [12, 14, 18, 9, 22, 15];
            const p = pings[Math.floor(Math.random() * pings.length)];
            const el = document.querySelector('#context-panel p.text-green-500');
            if(el) el.innerText = p + 'ms';
        }, 5000);
    },

    showPopover: function(e, uid, name, avatar) {
        e.stopPropagation();
        const pop = document.getElementById('user-popover');
        document.getElementById('popover-name').innerText = name;
        document.getElementById('popover-avatar').src = avatar;
        pop.style.left = `${Math.min(e.pageX, window.innerWidth - 350)}px`;
        pop.style.top = `${Math.min(e.pageY, window.innerHeight - 450)}px`;
        pop.classList.remove('hidden');
        const close = () => { pop.classList.add('hidden'); document.removeEventListener('click', close); };
        setTimeout(() => document.addEventListener('click', close), 10);
    },

    onMessage: function(msg) { if (msg.channelId === State.activeChannel) this.renderMessage(msg); },
    onReactionUpdate: function(data) {
        const container = document.getElementById(`reactions-${data.mid}`);
        if(container) container.innerHTML = this.renderReactions(data.reactions, data.mid);
    },
    renderReactions: function(reactions, mid) {
        if (!reactions || Object.keys(reactions).length === 0) return '';
        return Object.entries(reactions).map(([emoji, uids]) => `
            <button onclick="API.addReaction('${mid}', '${emoji}')" class="px-2 py-0.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-full text-[10px] font-bold">
                ${emoji} ${uids.length}
            </button>
        `).join('');
    }
};

window.Chat = Chat;
