import { State } from './state.js';
import { API } from './api.js';

export const Chat = {
    typingTimeout: null,
    isTyping: false,
    autoScroll: true,
    
    init: function() {
        // Global listeners for input
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
    },

    load: async function(id, name = 'Overview', isReadOnly = false) {
        // Clean up previous state
        if(State.activeChannel && API.socket) {
            API.socket.emit('leave', State.activeChannel);
        }
        
        State.activeChannel = id;
        
        // Update Header
        const roomNameEl = document.getElementById('room-name');
        const channelInfoEl = document.getElementById('channel-info');
        if (roomNameEl) roomNameEl.innerText = name;
        if (channelInfoEl) channelInfoEl.innerText = id === 'getting-started' ? 'Workspace Hub' : 'Encrypted Channel';

        // Toggle UI State
        const inputArea = document.getElementById('input-area');
        if (inputArea) inputArea.style.display = (id === 'getting-started' || isReadOnly) ? 'none' : 'flex';

        // Reset Feed
        const feed = document.getElementById('messages-feed');
        if (feed) {
            feed.innerHTML = ''; 
            // Add Loading State
            const loader = document.createElement('div');
            loader.id = 'chat-loader';
            loader.className = 'flex flex-col items-center justify-center h-full space-y-4 animate-pulse';
            loader.innerHTML = `
                <div class="w-8 h-8 border-2 border-slate-200 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Data</span>
            `;
            feed.appendChild(loader);
        }

        // Handle "Overview" specifically (Client-side view)
        if(id === 'getting-started') {
            this.renderOverview();
            return;
        }

        // Load Real Data
        try {
            const messages = await API.getMessages(id);
            const loader = document.getElementById('chat-loader');
            if(loader) loader.remove();

            if (messages.length === 0) {
                this.renderEmptyState();
            } else {
                messages.forEach(m => this.renderMessage(m));
                this.scrollToBottom(true);
            }
            
            // Join Socket Room
            if(API.socket && API.socket.connected) {
                API.socket.emit('join', id);
            }
            
            this.updateSidebarInfo();

        } catch(e) {
            console.error("Chat Load Error:", e);
            if(feed) feed.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-red-500">
                    <i data-lucide="wifi-off" class="w-8 h-8 mb-2"></i>
                    <span class="font-bold">Connection Failed</span>
                </div>
            `;
            if(window.lucide) lucide.createIcons();
        }
    },

    renderOverview: function() {
        const feed = document.getElementById('messages-feed');
        if(!feed) return;
        
        feed.innerHTML = `
            <div class="max-w-4xl mx-auto w-full h-full flex flex-col items-center justify-center p-8 animate-fade-up">
                <div class="bg-white dark:bg-white/5 p-1 rounded-2xl border border-slate-100 dark:border-white/10 mb-8 shadow-sm">
                    <div class="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10 rounded-xl flex items-center justify-center">
                        <i data-lucide="layout-grid" class="w-8 h-8 text-slate-700 dark:text-white"></i>
                    </div>
                </div>
                
                <h1 class="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 text-center tracking-tight">
                    Welcome back, ${State.user ? State.user.name : 'Guest'}
                </h1>
                
                <p class="text-slate-500 text-center max-w-lg mb-12 text-lg leading-relaxed">
                    Chatify is ready. Select a channel from the sidebar to start collaborating, or configure your workspace settings.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <button onclick="document.querySelector('.nav-channel')?.click()" class="group p-6 text-left bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl transition-all hover:scale-[1.02] shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <i data-lucide="message-circle" class="w-5 h-5"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-4 h-4 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-white transition-colors"></i>
                        </div>
                        <h3 class="font-bold text-slate-900 dark:text-white mb-1">Join General</h3>
                        <p class="text-sm text-slate-500">Jump into the main discussion.</p>
                    </button>

                    <button onclick="window.location.href='/settings.html'" class="group p-6 text-left bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl transition-all hover:scale-[1.02] shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <i data-lucide="sliders" class="w-5 h-5"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-4 h-4 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-white transition-colors"></i>
                        </div>
                        <h3 class="font-bold text-slate-900 dark:text-white mb-1">Configure</h3>
                        <p class="text-sm text-slate-500">Update your profile & theme.</p>
                    </button>
                </div>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
    },

    renderEmptyState: function() {
        const feed = document.getElementById('messages-feed');
        if(feed) feed.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-4">
                <div class="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                    <i data-lucide="ghost" class="w-8 h-8 text-slate-400"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">It's quiet here</p>
                    <p class="text-xs text-slate-500 mt-1">Be the first to send a message.</p>
                </div>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
    },

    handleTyping: function() {
        if (!State.activeChannel) return;
        
        if (!this.isTyping) {
            this.isTyping = true;
            API.sendTyping(State.activeChannel, true);
        }
        
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            API.sendTyping(State.activeChannel, false);
        }, 2000);
    },

    send: function() {
        const input = document.getElementById('msg-input');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text || !State.activeChannel) return;

        // Clear input immediately
        input.value = '';
        input.style.height = 'auto'; // Reset height if auto-expanding

        // Generate Temp ID
        const tempId = 'temp-' + Date.now();
        const msg = {
            id: tempId,
            uid: State.user.uid,
            name: State.user.name,
            avatar: State.user.avatar,
            text: text,
            ts: new Date().toISOString(),
            isTemp: true,
            reply_to: State.replyingTo
        };

        // Render Immediately
        this.renderMessage(msg);
        this.scrollToBottom();

        // Send to API
        API.sendMessage(State.activeChannel, text, tempId, State.replyingTo);
        
        // Clear Reply State
        this.clearReply();
    },

    renderMessage: function(m) {
        const feed = document.getElementById('messages-feed');
        if (!feed) return;

        // Check for temp message replacement
        if (!m.isTemp && m.nonce) {
            const temp = document.getElementById(m.nonce); // API sends back nonce as ID sometimes or we track it
            // Actually, simple way: remove temp by ID if we used nonce as ID, or just ignore dupes
            // For now, let's just append. The API broadcast will come back. 
            // Better: Remove any message with ID 'temp-...' that matches content? 
            // Simplest: Remove temp element if we find one with same nonce ID
            const tempEl = document.getElementById(m.nonce);
            if(tempEl) tempEl.remove();
        }

        // Prevent duplicates
        if (document.getElementById(m.id)) return;

        const isOwn = m.uid === State.user.uid;
        const msgEl = document.createElement('div');
        msgEl.id = m.id;
        msgEl.className = `flex w-full mb-6 ${isOwn ? 'justify-end' : 'justify-start'} group animate-fade-in`;

        // Avatar for others
        const avatarHtml = !isOwn ? `
            <img src="${m.avatar}" class="w-8 h-8 rounded-xl object-cover mr-3 bg-slate-100 dark:bg-white/10 shadow-sm cursor-pointer hover:scale-105 transition-transform" onclick="UI.showProfile('${m.uid}')">
        ` : '';

        // Timestamp
        const time = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Reply UI
        let replyHtml = '';
        if (m.reply_to) {
            replyHtml = `
                <div class="flex items-center gap-2 mb-1 text-[10px] text-slate-400 dark:text-slate-500 opacity-80 pl-1">
                    <i data-lucide="corner-down-right" class="w-3 h-3"></i>
                    <span class="font-bold">${m.reply_to.name}</span>
                    <span class="truncate max-w-[150px] italic">"${m.reply_to.text}"</span>
                </div>
            `;
        }

        // Message Bubble
        const bubbleClass = isOwn 
            ? "bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-sm" 
            : "bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 rounded-2xl rounded-tl-sm shadow-sm";

        msgEl.innerHTML = `
            ${avatarHtml}
            <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]">
                ${replyHtml}
                <div class="flex items-end gap-2 group-hover:gap-3 transition-all">
                    <div class="${bubbleClass} px-5 py-3 text-sm leading-relaxed relative group/bubble">
                        ${this.formatText(m.text)}
                        ${m.isTemp ? '<span class="absolute bottom-2 right-2 w-2 h-2 bg-white/50 rounded-full animate-pulse"></span>' : ''}
                    </div>
                    
                    <!-- Actions (Hidden by default, show on hover) -->
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center justify-end pb-1">
                        <button onclick="Chat.initReply('${m.id}', '${m.name}', '${this.escapeHtml(m.text)}')" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" title="Reply">
                            <i data-lucide="reply" class="w-3 h-3"></i>
                        </button>
                        <button onclick="API.addReaction('${m.id}', '❤️')" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-red-500 transition-colors" title="Like">
                            <i data-lucide="heart" class="w-3 h-3"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 mt-1.5 px-1">
                    <span class="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">${m.name} • ${time}</span>
                    <div id="reactions-${m.id}" class="flex gap-1">
                        ${this.renderReactions(m.reactions, m.id)}
                    </div>
                </div>
            </div>
        `;

        feed.appendChild(msgEl);
        if(window.lucide) lucide.createIcons();
    },

    renderReactions: function(reactions, mid) {
        if (!reactions || Object.keys(reactions).length === 0) return '';
        return Object.entries(reactions).map(([emoji, uids]) => `
            <button onclick="API.addReaction('${mid}', '${emoji}')" class="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-full text-[10px] hover:scale-110 transition-transform">
                <span>${emoji}</span>
                <span class="font-bold text-slate-500">${uids.length}</span>
            </button>
        `).join('');
    },

    formatText: function(text) {
        // Simple sanitization and formatting
        const div = document.createElement('div');
        div.innerText = text;
        let safe = div.innerHTML;
        // Basic Markdown
        safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
        safe = safe.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-black/30 px-1 rounded font-mono text-xs">$1</code>');
        return safe;
    },

    escapeHtml: function(str) {
        return str.replace(/'/g, "\\'");
    },

    scrollToBottom: function(force = false) {
        const feed = document.getElementById('messages-feed');
        if (feed && (this.autoScroll || force)) {
            feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
        }
    },

    initReply: function(id, name, text) {
        State.replyingTo = { id, name, text };
        const preview = document.getElementById('reply-preview');
        if (preview) {
            preview.innerHTML = `
                <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 backdrop-blur-md">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <i data-lucide="corner-up-left" class="w-4 h-4 text-blue-500"></i>
                        <div class="flex flex-col min-w-0">
                            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Replying to ${name}</span>
                            <span class="text-xs truncate text-slate-600 dark:text-slate-300">"${text}"</span>
                        </div>
                    </div>
                    <button onclick="Chat.clearReply()" class="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                        <i data-lucide="x" class="w-4 h-4 text-slate-500"></i>
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
        if (preview) {
            preview.innerHTML = '';
            preview.classList.add('hidden');
        }
    },

    updateSidebarInfo: function() {
        // Logic to update online counts or channel activity if needed
    },
    
    // Called by Socket
    onMessage: function(msg) {
        if (msg.channelId === State.activeChannel) {
            this.renderMessage(msg);
            this.scrollToBottom();
        }
    },

    onReactionUpdate: function(data) {
        const container = document.getElementById(`reactions-${data.mid}`);
        if(container) {
            container.innerHTML = this.renderReactions(data.reactions, data.mid);
        }
    }
};

window.Chat = Chat;
