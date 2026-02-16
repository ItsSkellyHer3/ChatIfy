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
                    <div class="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-spin"></div>
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
            
        } catch(e) {
            if(feed) feed.innerHTML = '<div class="text-center p-20 text-red-500 font-bold">Connection Failed</div>';
        }
    },

    renderOverview: function() {
        const feed = document.getElementById('messages-feed');
        if(!feed) return;
        
        feed.innerHTML = `
            <div class="max-w-4xl mx-auto w-full h-full flex flex-col items-center justify-center p-12">
                <div class="w-20 h-20 bg-black dark:bg-white rounded-2xl flex items-center justify-center mb-8 shadow-xl">
                    <i data-lucide="zap" class="w-8 h-8 text-white dark:text-black"></i>
                </div>
                
                <h1 class="text-4xl md:text-6xl font-black text-black dark:text-white mb-6 text-center tracking-tighter">
                    Systems Ready.
                </h1>
                
                <p class="text-gray-500 text-center max-w-lg mb-12 text-lg font-medium leading-relaxed">
                    Select a channel to begin secure communication.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                    <button onclick="document.querySelector('#channel-list > div')?.click()" class="group p-6 text-left bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl transition-all hover:bg-white dark:hover:bg-black hover:border-black dark:hover:border-white hover:shadow-lg">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-10 h-10 rounded-xl bg-white dark:bg-black flex items-center justify-center text-black dark:text-white border border-gray-200 dark:border-gray-800">
                                <i data-lucide="message-square" class="w-5 h-5"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-5 h-5 text-gray-300 group-hover:translate-x-2 transition-transform"></i>
                        </div>
                        <h3 class="font-bold text-lg text-black dark:text-white mb-1">Open Channel</h3>
                        <p class="text-xs text-gray-500">Join the primary thread.</p>
                    </button>

                    <button onclick="window.location.href='/settings.html'" class="group p-6 text-left bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl transition-all hover:bg-white dark:hover:bg-black hover:border-black dark:hover:border-white hover:shadow-lg">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-10 h-10 rounded-xl bg-white dark:bg-black flex items-center justify-center text-black dark:text-white border border-gray-200 dark:border-gray-800">
                                <i data-lucide="settings-2" class="w-5 h-5"></i>
                            </div>
                            <i data-lucide="arrow-right" class="w-5 h-5 text-gray-300 group-hover:translate-x-2 transition-transform"></i>
                        </div>
                        <h3 class="font-bold text-lg text-black dark:text-white mb-1">Configure</h3>
                        <p class="text-xs text-gray-500">Manage your profile.</p>
                    </button>
                </div>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
    },

    renderEmptyState: function() {
        const feed = document.getElementById('messages-feed');
        if(feed) feed.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full opacity-30 space-y-4">
                <i data-lucide="ghost" class="w-12 h-12 text-gray-400"></i>
                <span class="text-xs font-bold uppercase tracking-widest text-gray-500">No Messages</span>
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
                <div class="flex items-center gap-2 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide ${isOwn ? 'mr-1' : 'ml-12'}">
                    <i data-lucide="corner-down-right" class="w-3 h-3"></i>
                    <span>${m.reply_to.name}</span>
                </div>
            `;
        }

        // Strict Black & White Bubbles
        const bubbleClass = isOwn 
            ? "bg-black text-white dark:bg-white dark:text-black rounded-2xl rounded-tr-sm shadow-md" 
            : "bg-white text-black dark:bg-black dark:text-white border border-gray-200 dark:border-gray-800 rounded-2xl rounded-tl-sm";

        msgEl.innerHTML = `
            <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] lg:max-w-[70%]">
                ${replyHtml}
                <div class="flex items-end gap-3">
                    ${!isOwn ? `<img src="${m.avatar}" class="w-8 h-8 rounded-lg object-cover mb-1 shrink-0 bg-gray-100 border border-gray-200 dark:border-gray-800 cursor-pointer hover:opacity-80" onclick="Chat.showPopover(event, '${m.uid}', '${m.name}', '${m.avatar}')">` : ''}
                    
                    <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'}">
                        <div class="${bubbleClass} px-5 py-3 text-sm font-medium leading-relaxed relative overflow-hidden group/bubble">
                            ${this.formatText(m.text)}
                            ${m.isTemp ? '<span class="absolute bottom-2 right-2 w-1.5 h-1.5 bg-current rounded-full animate-pulse opacity-50"></span>' : ''}
                        </div>
                        
                        <div class="flex items-center gap-3 mt-1.5 px-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${time}</span>
                            <div id="reactions-${m.id}" class="flex gap-1">
                                ${this.renderReactions(m.reactions, m.id)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-1 mx-2 opacity-0 group-hover:opacity-100 transition-all justify-center">
                <button onclick="Chat.initReply('${m.id}', '${m.name}', '${this.escapeHtml(m.text)}')" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    <i data-lucide="reply" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="API.addReaction('${m.id}', '❤️')" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-400 hover:text-red-500 transition-colors">
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
        safe = safe.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded font-mono text-xs border border-gray-200 dark:border-gray-800">$1</code>');
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
                <span>Replying to <span class="font-bold">${name}</span></span>
                <button onclick="Chat.clearReply()"><i data-lucide="x" class="w-4 h-4"></i></button>
            `;
            if(window.lucide) lucide.createIcons();
            preview.classList.remove('hidden');
            preview.classList.add('flex');
        }
        document.getElementById('msg-input')?.focus();
    },

    clearReply: function() {
        State.replyingTo = null;
        const preview = document.getElementById('reply-preview');
        if(preview) {
            preview.classList.add('hidden');
            preview.classList.remove('flex');
        }
    },

    showPopover: function(e, uid, name, avatar) {
        e.stopPropagation();
        const pop = document.getElementById('user-popover');
        document.getElementById('popover-name').innerText = name;
        document.getElementById('popover-avatar').src = avatar;
        pop.style.left = `${Math.min(e.pageX, window.innerWidth - 300)}px`;
        pop.style.top = `${Math.min(e.pageY, window.innerHeight - 300)}px`;
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
            <button onclick="API.addReaction('${mid}', '${emoji}')" class="px-2 py-0.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full text-[10px] font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                ${emoji} ${uids.length}
            </button>
        `).join('');
    }
};

window.Chat = Chat;
