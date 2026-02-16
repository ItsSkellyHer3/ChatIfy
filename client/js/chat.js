import { State } from './state.js';
import { API } from './api.js';

export const Chat = {
    typingUsers: new Set(),
    isTyping: false,
    typingTimeout: null,
    autoDeleteMode: false,
    autoScroll: true,
    activePopoverUid: null,
    commands: [
        { name: '/clear', desc: 'Clear chat', icon: 'trash-2' },
        { name: '/stealth', desc: 'Toggle Stealth Mode', icon: 'eye-off' },
        { name: '/shrug', desc: '¯\\_(ツ)_/¯', icon: 'smile' },
        { name: '/help', desc: 'View shortcuts', icon: 'help-circle' }
    ],
    emojiSets: {
        "Recent": ['😀','😂','😍','🤔','🔥','❤️','✨','🚀'],
        "Smilies": ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🫡','🤫','🫠','🤥','😶','🫥','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','😵‍💫','🫨','🤐','🥴','🤢','🤮','🤧','🥵','🥶','🤡','👹','👺','👻','💀','☠️','👽','👾','🤖','💩'],
        "Gestures": ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦵','🦿','🦶','👣','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','🫦','💋'],
        "Hearts": ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','❤️‍🔥','❤️‍🩹','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟'],
        "Objects": ['🚀','🎉','🎊','🎈','🎂','🎆','🎇','🧨','✨','🌟','⭐️','🌈','☀️','☁️','⛅','⛈️','🌤️','🌥️','🌦️','🌧️','🌨️','🌩️','🌪️','💨','🌬️','🌀','🌊','💧','💦','☔','⚡','🔥','💥','❄️','☃️','⛄','☄️','💎','💍','💄','👠','👞','👟','🥾','🥿','👡','👢','🧤','🧣','🎩','🧢','👒','🎓','🎒','💼','👜','👛','👓','🕶️','🥽','🥼','🦺','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻','🩱','🩲','🩳','👙']
    },

    load: async function(id, name, isReadOnly = false) {
        if(State.activeChannel && API.socket) API.socket.emit('leave', State.activeChannel);
        
        State.activeChannel = id;
        this.typingUsers.clear();
        this.updateTypingUI();
        this.closeEmojiPicker();

        const roomEl = document.getElementById('room-name');
        if(roomEl) roomEl.innerText = name;
        
        const inputArea = document.getElementById('input-container');
        if(inputArea) inputArea.style.display = isReadOnly ? 'none' : 'block';

        const feed = document.getElementById('messages-feed');
        if(feed) {
            feed.innerHTML = '<div class="flex items-center justify-center py-20 text-sm text-gray-500 animate-pulse">Loading messages...</div>';
            feed.onscroll = () => {
                this.autoScroll = feed.scrollHeight - feed.scrollTop <= feed.clientHeight + 100;
            };
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
                    feed.innerHTML = `
                        <div class="py-32 flex flex-col items-center text-center opacity-60">
                            <div class="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                                <i data-lucide="message-square" class="w-8 h-8 text-gray-400"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">No messages yet</h3>
                            <p class="text-sm text-gray-500 mt-2 max-w-xs">Be the first to send a message in this channel.</p>
                        </div>
                    `;
                    if(window.lucide) lucide.createIcons();
                } else {
                    messages.forEach(m => this.renderMsg(m.id, m));
                }
                this.scrollToBottom(true);
            }
            this.updateRoomInfo(id);
        } catch(e) { 
            if(feed) feed.innerHTML = '<div class="text-sm font-medium text-red-500 p-8 text-center">Unable to load messages. Check your connection.</div>';
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
            membersEl.innerHTML = users.slice(0, 10).map(u => `
                <div class="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer group" onclick="Chat.showPopover(event, '${u.uid || u.id}', '${u.name}', '${u.avatar}')">
                    <div class="relative shrink-0">
                        <img src="${u.avatar}" class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 border border-white dark:border-white/10 object-cover">
                        <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-black rounded-full"></div>
                    </div>
                    <div class="flex flex-col min-w-0">
                        <span class="text-sm font-semibold text-gray-900 dark:text-white truncate">${u.name}</span>
                        <span class="text-xs text-gray-500 truncate">Online</span>
                    </div>
                </div>
            `).join('');
            if(users.length > 10) {
                membersEl.innerHTML += `<div class="text-center py-2 text-xs font-semibold text-gray-500">+ ${users.length - 10} more</div>`;
            }
        } catch(e) {}
    },

    renderGettingStarted: function() {
        const feed = document.getElementById('messages-feed');
        if(!feed) return;
        feed.innerHTML = `
            <div class="max-w-3xl mx-auto space-y-12 py-16 animate-fade px-4">
                <div class="space-y-6 text-center">
                    <div class="w-20 h-20 bg-black dark:bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                        <i data-lucide="message-square" class="w-10 h-10 text-white dark:text-black"></i>
                    </div>
                    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">Open Source Communication</h1>
                    <p class="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">Welcome to Chatify, an open-source messaging platform. Built for the community, by the community.</p>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                    <div class="p-8 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <i data-lucide="github" class="w-6 h-6 text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">MIT Licensed</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">The entire source code is available on GitHub. You are free to inspect, fork, and host your own instance.</p>
                    </div>
                    <div class="p-8 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <i data-lucide="shield" class="w-6 h-6 text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Privacy First</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">No tracking, no cookies, and no data collection. Just ephemeral messaging for your security.</p>
                    </div>
                </div>

                <div class="flex justify-center pt-8">
                    <button onclick="API.downloadSource()" class="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:scale-105 transition-transform shadow-lg flex items-center gap-2">
                        <i data-lucide="download" class="w-4 h-4"></i> Download Source
                    </button>
                </div>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
    },

    handleTyping: function() {
        const input = document.getElementById('msg-input');
        if(input.value.startsWith('/')) this.showCommandSuggestions(input.value);
        else this.hideCommandSuggestions();

        if(!this.isTyping) {
            this.isTyping = true;
            API.sendTyping(State.activeChannel, true);
        }
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => this.stopTyping(), 3000);
    },

    showCommandSuggestions: function(query) {
        const popup = document.getElementById('command-suggestions');
        const list = document.getElementById('command-list');
        const filtered = this.commands.filter(c => c.name.startsWith(query.toLowerCase()));
        if(filtered.length > 0) {
            popup.classList.remove('hidden');
            list.innerHTML = filtered.map(c => `
                <button onclick="Chat.useCommand('${c.name}')" class="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors w-full text-left">
                    <div class="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <i data-lucide="${c.icon}" class="w-4 h-4"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-gray-900 dark:text-white">${c.name}</span>
                        <span class="text-xs text-gray-500">${c.desc}</span>
                    </div>
                </button>
            `).join('');
            if(window.lucide) lucide.createIcons();
        } else this.hideCommandSuggestions();
    },

    hideCommandSuggestions: function() {
        const popup = document.getElementById('command-suggestions');
        if(popup) popup.classList.add('hidden');
    },

    useCommand: function(cmd) {
        const input = document.getElementById('msg-input');
        if(cmd === '/clear') document.getElementById('messages-feed').innerHTML = '';
        else if(cmd === '/stealth') import('./modules/settings.js').then(m => m.Settings.saveSetting('stealthMode', !State.settings.stealthMode));
        else if(cmd === '/shrug') { input.value = '¯\\_(ツ)_/¯'; this.send(); return; }
        input.value = '';
        this.hideCommandSuggestions();
    },

    toggleEmojiPicker: function() {
        const picker = document.getElementById('emoji-picker');
        const isHidden = picker.classList.toggle('hidden');
        if(!isHidden) {
            const grid = document.getElementById('emoji-grid');
            grid.innerHTML = '';
            Object.entries(this.emojiSets).forEach(([category, set]) => {
                const label = document.createElement('div');
                label.className = "col-span-6 text-xs font-bold text-gray-500 mt-4 mb-2 px-2";
                label.innerText = category;
                grid.appendChild(label);
                
                set.forEach(e => {
                    const btn = document.createElement('button');
                    btn.className = "w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-xl transition-transform hover:scale-110";
                    btn.innerText = e;
                    btn.onclick = () => this.insertEmoji(e);
                    grid.appendChild(btn);
                });
            });
        }
    },

    closeEmojiPicker: function() {
        const picker = document.getElementById('emoji-picker');
        if(picker) picker.classList.add('hidden');
    },

    insertEmoji: function(e) {
        const input = document.getElementById('msg-input');
        input.value += e;
        input.focus();
    },

    toggleAutoDelete: function() {
        this.autoDeleteMode = !this.autoDeleteMode;
        document.getElementById('auto-delete-toggle').classList.toggle('text-red-500', this.autoDeleteMode);
    },

    send: function() {
        const input = document.getElementById('msg-input');
        const text = input.value.trim();
        if(!text || !State.activeChannel) return;
        if(text.startsWith('/')) { const cmd = text.split(' ')[0]; if(this.commands.some(c => c.name === cmd)) { this.useCommand(cmd); return; } }

        this.stopTyping();
        const nonce = Math.random().toString(36).substring(7);
        this.renderMsg(`temp-${nonce}`, { id: `temp-${nonce}`, nonce, uid: State.user.uid, name: State.user.name, avatar: State.user.avatar, text, ts: new Date().toISOString(), isTemp: true });
        input.value = '';
        API.sendMessage(State.activeChannel, text, nonce, State.replyingTo);
        State.replyingTo = null;
        const preview = document.getElementById('reply-preview');
        if(preview) preview.innerHTML = '';
    },

    renderMsg: function(id, m) {
        const feed = document.getElementById('messages-feed');
        if(!feed || document.getElementById(id)) return;
        
        if(!m.isTemp && m.nonce) { const temp = document.getElementById(`temp-${m.nonce}`); if(temp) temp.remove(); }

        const isOwn = m.uid === State.user.uid;
        const div = document.createElement('div');
        div.id = id;
        div.className = `msg-item animate-fade ${isOwn ? 'own' : ''} ${m.isTemp ? 'opacity-70' : ''}`;
        
        const time = dayjs(m.ts).format('HH:mm');
        
        let rawText = DOMPurify.sanitize(m.text);
        rawText = rawText.replace(/```([\s\S]*?)```/g, '<code-block>$1</code-block>');
        rawText = rawText.replace(/@(\w+)/g, '<span class="mention">@$1</span>');

        let replyHtml = '';
        if(m.reply_to) {
            replyHtml = `
                <div class="flex items-center gap-2 mb-1 opacity-70">
                    <div class="w-0.5 h-3 bg-gray-300 dark:bg-white/30 rounded-full"></div>
                    <span class="text-xs font-medium truncate max-w-[200px]">Reply to ${m.reply_to.name}</span>
                </div>
            `;
        }

        // Standard Layout
        div.innerHTML = `
            ${!isOwn ? `<img src="${m.avatar}" class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onclick="Chat.showPopover(event, '${m.uid}', '${m.name}', '${m.avatar}')">` : ''}
            
            <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0 max-w-full">
                ${!isOwn ? `<div class="flex items-baseline gap-2 mb-1 ml-1"><span class="text-xs font-bold text-gray-900 dark:text-white cursor-pointer hover:underline" onclick="Chat.showPopover(event, '${m.uid}', '${m.name}', '${m.avatar}')">${m.name}</span><span class="text-[10px] text-gray-500">${time}</span></div>` : ''}
                
                ${replyHtml}
                
                <div class="msg-bubble shadow-sm ${isOwn ? '' : 'dark:bg-white/10'}">
                    <div class="markdown-content text-[15px]">${rawText}</div>
                </div>
                
                ${isOwn ? `<div class="text-[10px] text-gray-400 mt-1 mr-1">${time} ${m.isTemp ? '• Sending...' : ''}</div>` : ''}
            </div>
            
            <div class="msg-actions">
                <button onclick="Chat.setReply('${id}', '${m.name}', '${m.text.replace(/'/g, "\\'")}')" class="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-colors" title="Reply">
                    <i data-lucide="reply" class="w-4 h-4"></i>
                </button>
                <button onclick="API.addReaction('${id}', '👍')" class="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-sm transition-transform hover:scale-110">👍</button>
                <button onclick="API.addReaction('${id}', '🔥')" class="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-sm transition-transform hover:scale-110">🔥</button>
                ${isOwn ? `
                <button onclick="API.deleteMessage('${id}', '${m.uid}')" class="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-colors" title="Delete">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>` : ''}
            </div>
        `;

        feed.appendChild(div);
        if(window.lucide) lucide.createIcons();
        this.scrollToBottom();
    },

    setReply: function(id, name, text) {
        State.replyingTo = { id, name, text: text.substring(0, 60) };
        const el = document.getElementById('reply-preview');
        if(el) {
            el.innerHTML = `
                <div class="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-3 rounded-xl mb-4 border border-gray-100 dark:border-white/5 animate-fade">
                    <div class="flex flex-col gap-0.5 pl-2 border-l-2 border-blue-500">
                        <span class="text-xs font-bold text-blue-500">Replying to ${name}</span>
                        <span class="text-sm text-gray-600 dark:text-gray-300 truncate max-w-md">${text}</span>
                    </div>
                    <button onclick="State.replyingTo = null; document.getElementById('reply-preview').innerHTML = ''" class="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-500 transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
                </div>
            `;
            if(window.lucide) lucide.createIcons();
        }
        document.getElementById('msg-input').focus();
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
        if(el) el.innerText = this.typingUsers.size > 0 ? `${Array.from(this.typingUsers).join(', ')} is typing...` : '';
    },
    onTypingUpdate: function(data) {
        if(data.cid !== State.activeChannel) return;
        if(data.isTyping) this.typingUsers.add(data.name); else this.typingUsers.delete(data.name);
        this.updateTypingUI();
    },
    scrollToBottom: function(force = false) {
        const feed = document.getElementById('messages-feed');
        if(feed && (this.autoScroll || force)) feed.scrollTop = feed.scrollHeight;
    },
    handleUpload: async function(input) {
        if(input.files && input.files[0]) {
            try {
                const res = await API.uploadFile(input.files[0]);
                if(res && res.url) API.sendMessage(State.activeChannel, `![${res.filename}](${res.url})`);
            } catch(e) { alert("Upload Failed"); }
            finally { input.value = ''; }
        }
    },
    toggleSearch: function() {
        const query = prompt("Search Messages:");
        if(query) {
            document.querySelectorAll('.msg-item').forEach(m => m.classList.toggle('hidden', !m.innerText.toLowerCase().includes(query.toLowerCase())));
        } else document.querySelectorAll('.msg-item').forEach(m => m.classList.remove('hidden'));
    }
};

window.Chat = Chat;
