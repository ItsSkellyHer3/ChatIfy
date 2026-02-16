import { State } from './state.js';
import { API } from './api.js';

export const Chat = {
    typingUsers: new Set(),
    isTyping: false,
    typingTimeout: null,
    autoScroll: true,
    activePopoverUid: null,
    commands: [
        { name: '/clear', desc: 'Clear view', icon: 'trash-2' },
        { name: '/shrug', desc: '¯\\_(ツ)_/¯', icon: 'smile' }
    ],
    emojiSets: {
        "Recent": ['😀','😂','😍','🤔','🔥','❤️','✨','🚀'],
        "Smilies": ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡'],
    },

    load: async function(id, name, isReadOnly = false) {
        if(State.activeChannel && API.socket) API.socket.emit('leave', State.activeChannel);
        
        State.activeChannel = id;
        this.typingUsers.clear();
        this.updateTypingUI();
        
        const roomEl = document.getElementById('room-name');
        if(roomEl) roomEl.innerText = name;
        
        const inputArea = document.getElementById('input-container');
        if(inputArea) inputArea.style.display = isReadOnly ? 'none' : 'block';

        const feed = document.getElementById('messages-feed');
        if(feed) {
            feed.innerHTML = '<div class="flex items-center justify-center py-20 text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Loading...</div>';
        }

        if(id === 'getting-started') {
            this.renderGettingStarted();
            return;
        }

        try {
            const messages = await API.getMessages(id);
            if(feed) {
                feed.innerHTML = '';
                if(messages.length === 0) {
                    feed.innerHTML = `<div class="py-32 flex flex-col items-center text-center opacity-40"><p class="text-sm font-medium text-slate-500">No messages here yet.</p></div>`;
                } else {
                    messages.forEach(m => this.renderMsg(m.id, m));
                }
                this.scrollToBottom(true);
            }
            this.updateRoomInfo(id);
        } catch(e) { 
            if(feed) feed.innerHTML = '<div class="text-xs font-bold text-red-500 p-8 text-center uppercase tracking-widest">Connection Error</div>';
        }
        
        if(API.socket) API.socket.emit('join', id);
    },

    updateRoomInfo: async function(id) {
        const countEl = document.getElementById('room-member-count');
        const membersEl = document.getElementById('room-members');
        if(!countEl || !membersEl) return;

        try {
            const users = await API.getUsers();
            countEl.innerText = users.length;
            membersEl.innerHTML = users.slice(0, 15).map(u => `
                <div class="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer group" onclick="Chat.showPopover(event, '${u.uid || u.id}', '${u.name}', '${u.avatar}')">
                    <img src="${u.avatar}" class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 border border-white dark:border-white/10 object-cover">
                    <div class="flex flex-col min-w-0">
                        <span class="text-xs font-bold text-slate-900 dark:text-white truncate">${u.name}</span>
                        <span class="text-[9px] text-green-500 font-bold uppercase tracking-tight">Online</span>
                    </div>
                </div>
            `).join('');
        } catch(e) {}
    },

    handleTyping: function() {
        if(!this.isTyping) {
            this.isTyping = true;
            API.sendTyping(State.activeChannel, true);
        }
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => this.stopTyping(), 3000);
    },

    send: function() {
        const input = document.getElementById('msg-input');
        const text = input.value.trim();
        if(!text || !State.activeChannel) return;

        this.stopTyping();
        const nonce = Math.random().toString(36).substring(7);
        this.renderMsg(`temp-${nonce}`, { id: `temp-${nonce}`, nonce, uid: State.user.uid, name: State.user.name, avatar: State.user.avatar, text, ts: new Date().toISOString(), isTemp: true, reactions: {} });
        input.value = '';
        API.sendMessage(State.activeChannel, text, nonce, State.replyingTo);
        this.clearReply();
    },

    renderMsg: function(id, m) {
        const feed = document.getElementById('messages-feed');
        if(!feed || document.getElementById(id)) return;
        
        if(!m.isTemp && m.nonce) { const temp = document.getElementById(`temp-${m.nonce}`); if(temp) temp.remove(); }

        const isOwn = m.uid === State.user.uid;
        const div = document.createElement('div');
        div.id = id;
        div.className = `flex flex-col gap-1 mb-4 animate-fade ${isOwn ? 'items-end' : 'items-start'}`;
        
        const time = dayjs(m.ts).format('HH:mm');
        const sanitizedText = DOMPurify.sanitize(m.text);

        let replyHtml = '';
        if(m.reply_to) {
            replyHtml = `
                <div class="flex items-center gap-2 mb-1 px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-lg border-l-2 border-slate-300 dark:border-white/20 opacity-60 ml-2">
                    <span class="text-[10px] font-bold text-slate-500 truncate max-w-[200px]">Replied to ${m.reply_to.name}: ${m.reply_to.text}</span>
                </div>
            `;
        }

        let reactionHtml = '';
        if(m.reactions && Object.keys(m.reactions).length > 0) {
            reactionHtml = `<div class="flex flex-wrap gap-1 mt-1">` + Object.entries(m.reactions).map(([emoji, uids]) => `
                <button onclick="API.addReaction('${id}', '${emoji}')" class="px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-full text-[10px] font-bold flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                    <span>${emoji}</span>
                    <span class="text-slate-500">${uids.length}</span>
                </button>
            `).join('') + `</div>`;
        }

        div.innerHTML = `
            ${replyHtml}
            <div class="flex gap-3 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}">
                <img src="${m.avatar}" class="w-8 h-8 rounded-lg object-cover shrink-0 mt-1 cursor-pointer" onclick="Chat.showPopover(event, '${m.uid}', '${m.name}', '${m.avatar}')">
                <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'}">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[11px] font-bold text-slate-900 dark:text-white">${m.name}</span>
                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">${time}</span>
                    </div>
                    <div class="px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${isOwn ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-none' : 'bg-slate-100 dark:bg-white/5 dark:text-white rounded-tl-none'}">
                        ${sanitizedText}
                    </div>
                    ${reactionHtml}
                </div>
            </div>
            <div class="flex gap-2 mt-1 px-1 opacity-0 hover:opacity-100 transition-opacity">
                <button onclick="Chat.setReply('${id}', '${m.name}', '${m.text.replace(/'/g, "\\'")}')" class="text-[10px] font-bold text-slate-400 uppercase hover:text-black dark:hover:text-white transition-colors">Reply</button>
                <button onclick="API.addReaction('${id}', '👍')" class="text-[10px] hover:scale-125 transition-transform">👍</button>
                <button onclick="API.addReaction('${id}', '❤️')" class="text-[10px] hover:scale-125 transition-transform">❤️</button>
            </div>
        `;

        feed.appendChild(div);
        if(window.lucide) lucide.createIcons();
        this.scrollToBottom();
    },

    setReply: function(id, name, text) {
        State.replyingTo = { id, name, text: text.substring(0, 40) + (text.length > 40 ? '...' : '') };
        const el = document.getElementById('reply-preview');
        if(el) {
            el.innerHTML = `
                <div class="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-3 rounded-xl mb-4 border border-slate-200 dark:border-white/5">
                    <div class="flex flex-col pl-2 border-l-2 border-black dark:border-white">
                        <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Replying to ${name}</span>
                        <span class="text-xs font-medium truncate max-w-md">"${text}"</span>
                    </div>
                    <button onclick="Chat.clearReply()" class="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg"><i data-lucide="x" class="w-4 h-4"></i></button>
                </div>
            `;
            if(window.lucide) lucide.createIcons();
        }
        document.getElementById('msg-input').focus();
    },

    clearReply: function() {
        State.replyingTo = null;
        const el = document.getElementById('reply-preview');
        if(el) el.innerHTML = '';
    },

    onReactionUpdate: function(data) {
        const msgEl = document.getElementById(data.mid);
        if(!msgEl) return;
        
        const reactionContainer = msgEl.querySelector('.flex.flex-wrap.gap-1.mt-1');
        if(reactionContainer) {
            reactionContainer.innerHTML = Object.entries(data.reactions).map(([emoji, uids]) => `
                <button onclick="API.addReaction('${data.mid}', '${emoji}')" class="px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-full text-[10px] font-bold flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                    <span>${emoji}</span>
                    <span class="text-slate-500">${uids.length}</span>
                </button>
            `).join('');
        } else {
            // If container doesn't exist, we might need a more robust re-render or just ignore for now
            // since renderMsg creates it if there are reactions.
        }
    },

    showPopover: function(e, uid, name, avatar) {
        e.stopPropagation();
        this.activePopoverUid = uid;
        const pop = document.getElementById('user-popover');
        const n = document.getElementById('popover-name');
        const av = document.getElementById('popover-avatar');
        n.innerText = name;
        av.src = avatar;
        pop.style.left = `${Math.min(e.pageX, window.innerWidth - 300)}px`;
        pop.style.top = `${Math.min(e.pageY, window.innerHeight - 400)}px`;
        pop.classList.remove('hidden');
        const close = () => { pop.classList.add('hidden'); document.removeEventListener('click', close); };
        setTimeout(() => document.addEventListener('click', close), 10);
    },

    startDM: function() {
        if(!this.activePopoverUid) return;
        const targetName = document.getElementById('popover-name').innerText;
        const dmId = [State.user.uid, this.activePopoverUid].sort().join('_');
        this.load(dmId, targetName);
        document.getElementById('user-popover').classList.add('hidden');
    },

    onMessage: function(msg) { if(msg.channelId === State.activeChannel) this.renderMsg(msg.id, msg); },
    stopTyping: function() { if(this.isTyping) { this.isTyping = false; API.sendTyping(State.activeChannel, false); } },
    updateTypingUI: function() {
        const el = document.getElementById('typing-indicator');
        if(el) el.innerText = this.typingUsers.size > 0 ? `${Array.from(this.typingUsers).join(', ')} typing...` : '';
    },
    onTypingUpdate: function(data) {
        if(data.cid !== State.activeChannel) return;
        if(data.isTyping) this.typingUsers.add(data.name); else this.typingUsers.delete(data.name);
        this.updateTypingUI();
    },
    scrollToBottom: function(force = false) {
        const feed = document.getElementById('messages-feed');
        if(feed && (this.autoScroll || force)) feed.scrollTop = feed.scrollHeight;
    }
};

window.Chat = Chat;
