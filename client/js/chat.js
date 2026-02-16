import { State } from './state.js';
import { API } from './api.js';

export const Chat = {
    typingTimeout: null,
    isTyping: false,
    autoScroll: true,
    lastMsgUid: null, // For message grouping
    
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
            // Auto-resize
            input.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
        this.startSystemMonitors();
    },

    load: async function(id, name = 'Overview', isReadOnly = false) {
        if(State.activeChannel && API.socket) {
            API.socket.emit('leave', State.activeChannel);
        }
        
        State.activeChannel = id;
        this.lastMsgUid = null;
        
        // Header Sync
        const roomLabels = document.querySelectorAll('#room-name, #context-room-name');
        roomLabels.forEach(el => el.innerText = name);

        const feed = document.getElementById('messages-feed');
        if (feed) {
            feed.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full space-y-4 opacity-0 animate-fade-in" style="animation-fill-mode: forwards;">
                    <div class="w-10 h-10 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
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
            if(feed) feed.innerHTML = '<div class="text-center py-20 text-sm text-red-500 font-medium">Connection Lost</div>';
        }
    },

    renderOverview: function() {
        const feed = document.getElementById('messages-feed');
        if(!feed) return;
        
        feed.innerHTML = `
            <div class="max-w-3xl mx-auto w-full h-full flex flex-col items-center justify-center p-8 animate-fade-in">
                <div class="w-20 h-20 bg-white dark:bg-white/5 rounded-[2rem] shadow-soft flex items-center justify-center mb-8">
                    <i data-lucide="zap" class="w-8 h-8 text-yellow-500"></i>
                </div>
                
                <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 text-center tracking-tight">
                    Welcome back.
                </h1>
                
                <p class="text-gray-500 text-center max-w-lg mb-12 text-lg leading-relaxed">
                    Chatify is ready. Your workspace is encrypted and ephemeral.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <button onclick="document.querySelector('#channel-list > div')?.click()" class="group p-6 text-left bg-white dark:bg-white/5 border border-white/50 dark:border-white/5 rounded-[2rem] hover:shadow-soft transition-all hover:-translate-y-1">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <i data-lucide="message-circle" class="w-6 h-6"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors"></i>
                        </div>
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-1">General Channel</h3>
                        <p class="text-sm text-gray-500">Join the main discussion.</p>
                    </button>

                    <button onclick="window.location.href='/settings.html'" class="group p-6 text-left bg-white dark:bg-white/5 border border-white/50 dark:border-white/5 rounded-[2rem] hover:shadow-soft transition-all hover:-translate-y-1">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <i data-lucide="user" class="w-6 h-6"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors"></i>
                        </div>
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-1">Your Profile</h3>
                        <p class="text-sm text-gray-500">Manage identity settings.</p>
                    </button>
                </div>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
    },

    renderEmptyState: function() {
        const feed = document.getElementById('messages-feed');
        if(feed) feed.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full opacity-40 space-y-4">
                <div class="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                    <i data-lucide="wind" class="w-6 h-6 text-gray-400"></i>
                </div>
                <span class="text-sm font-medium text-gray-500">No messages yet</span>
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
        input.style.height = 'auto'; // Reset height
        
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
        const isGrouped = this.lastMsgUid === m.uid && !m.reply_to; // Group if same user and not a reply
        this.lastMsgUid = m.uid;

        const msgEl = document.createElement('div');
        msgEl.id = m.id;
        msgEl.className = `flex w-full ${isGrouped ? 'mt-1' : 'mt-6'} ${isOwn ? 'justify-end' : 'justify-start'} group relative`;

        const time = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let replyHtml = '';
        if (m.reply_to) {
            replyHtml = `
                <div class="flex items-center gap-2 mb-2 text-xs text-gray-400 dark:text-gray-500 pl-1 ${isOwn ? 'mr-2' : 'ml-12'}">
                    <i data-lucide="corner-up-left" class="w-3 h-3"></i>
                    <span class="font-medium">Replying to ${m.reply_to.name}</span>
                </div>
            `;
        }

        // Refined Bubbles
        const bubbleClass = isOwn 
            ? "msg-bubble-own px-5 py-3 text-[15px] leading-relaxed shadow-sm" 
            : "msg-bubble-other px-5 py-3 text-[15px] leading-relaxed";

        const avatarHtml = (!isOwn && !isGrouped) ? `
            <img src="${m.avatar}" class="w-9 h-9 rounded-xl object-cover mr-3 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" onclick="Chat.showPopover(event, '${m.uid}', '${m.name}', '${m.avatar}')">
        ` : (!isOwn && isGrouped) ? `<div class="w-9 mr-3"></div>` : '';

        // Only show name if not grouped and not own
        const nameHtml = (!isOwn && !isGrouped) ? `
            <div class="flex items-baseline gap-2 mb-1 ml-1">
                <span class="text-sm font-bold text-gray-900 dark:text-white cursor-pointer hover:underline" onclick="Chat.showPopover(event, '${m.uid}', '${m.name}', '${m.avatar}')">${m.name}</span>
                <span class="text-[10px] text-gray-400">${time}</span>
            </div>
        ` : '';

        msgEl.innerHTML = `
            <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[80%] lg:max-w-[70%]">
                ${replyHtml}
                <div class="flex items-end">
                    ${avatarHtml}
                    <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'}">
                        ${nameHtml}
                        <div class="${bubbleClass} relative group/bubble">
                            ${this.formatText(m.text)}
                            ${m.isTemp ? '<span class="absolute bottom-2 right-2 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse"></span>' : ''}
                        </div>
                        
                        ${/* Reactions */ ''}
                        <div id="reactions-${m.id}" class="flex gap-1 mt-1 empty:hidden">
                            ${this.renderReactions(m.reactions, m.id)}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quick Actions (Hover) -->
            <div class="absolute ${isOwn ? 'left-auto right-full mr-2' : 'left-full ml-2'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onclick="Chat.initReply('${m.id}', '${m.name}', '${this.escapeHtml(m.text)}')" class="p-2 rounded-full bg-white dark:bg-white/10 shadow-sm hover:scale-110 transition-transform text-gray-500">
                    <i data-lucide="reply" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="API.addReaction('${m.id}', '❤️')" class="p-2 rounded-full bg-white dark:bg-white/10 shadow-sm hover:scale-110 transition-transform text-gray-500 hover:text-red-500">
                    <i data-lucide="heart" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;

        feed.appendChild(msgEl);
        if(window.lucide) lucide.createIcons();
        
        if (animate) {
            gsap.from(msgEl, { opacity: 0, y: 10, duration: 0.4, ease: "power2.out" });
        }
        
        this.scrollToBottom();
    },

    formatText: function(text) {
        const div = document.createElement('div');
        div.innerText = text;
        let safe = div.innerHTML;
        // Links
        safe = safe.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="underline decoration-white/30 hover:decoration-white transition-all">$1</a>');
        // Bold/Italic
        safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Code
        safe = safe.replace(/`([^`]+)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-[13px] font-mono">$1</code>');
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
        const target = document.getElementById('reply-target');
        const content = document.getElementById('reply-content');
        
        if (preview && target && content) {
            target.innerText = name;
            content.innerText = text;
            
            preview.classList.remove('hidden');
            // Animate in
            gsap.fromTo(preview, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)" });
        }
        document.getElementById('msg-input')?.focus();
    },

    clearReply: function() {
        State.replyingTo = null;
        const preview = document.getElementById('reply-preview');
        if(preview) {
            gsap.to(preview, { y: 10, opacity: 0, duration: 0.2, onComplete: () => preview.classList.add('hidden') });
        }
    },

    updateRoomData: async function() {
        try {
            const users = await API.getUsers();
            const countLabels = document.querySelectorAll('#online-count, #stat-members');
            countLabels.forEach(el => el.innerText = users.length);
        } catch(e) {}
    },

    startSystemMonitors: function() {
        setInterval(() => {
            const pings = [12, 18, 9, 24, 15]; // Simulated jitter
            const p = pings[Math.floor(Math.random() * pings.length)];
            const el = document.getElementById('stat-ping');
            if(el) el.innerText = p + 'ms';
        }, 3000);
    },

    showPopover: function(e, uid, name, avatar) {
        e.stopPropagation();
        const pop = document.getElementById('user-popover');
        document.getElementById('popover-name').innerText = name;
        document.getElementById('popover-avatar').src = avatar;
        
        // Position intelligently
        const x = Math.min(e.pageX, window.innerWidth - 320);
        const y = Math.min(e.pageY, window.innerHeight - 400);
        
        gsap.set(pop, { display: 'block', left: x, top: y, opacity: 0, scale: 0.9 });
        gsap.to(pop, { opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" });

        const close = () => { 
            gsap.to(pop, { opacity: 0, scale: 0.9, duration: 0.2, onComplete: () => pop.style.display = 'none' });
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
            <button onclick="API.addReaction('${mid}', '${emoji}')" class="px-2 py-0.5 bg-white dark:bg-white/10 rounded-full text-[10px] font-bold shadow-sm hover:scale-110 transition-transform">
                ${emoji} <span class="text-gray-500 ml-0.5">${uids.length}</span>
            </button>
        `).join('');
    }
};

window.Chat = Chat;
