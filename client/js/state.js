export const State = {
    user: JSON.parse(localStorage.getItem('chatify_user')) || null,
    activeChannel: null,
    socket: null,
    isTyping: false,
    replyingTo: null,
    trustedPeers: JSON.parse(localStorage.getItem('chatify_trusted')) || [],
    settings: JSON.parse(localStorage.getItem('chatify_settings')) || {
        theme: 'onyx',
        sounds: true,
        privacyBlur: true,
        stealthMode: false,
        fontSize: 'medium'
    }
};

export const saveUser = (user) => {
    State.user = user;
    localStorage.setItem('chatify_user', JSON.stringify(user));
};

export const clearUser = () => {
    State.user = null;
    localStorage.removeItem('chatify_user');
    localStorage.removeItem('chatify_trusted');
    window.location.href = '/';
};

export const toggleTrust = (uid) => {
    const index = State.trustedPeers.indexOf(uid);
    if (index === -1) State.trustedPeers.push(uid);
    else State.trustedPeers.splice(index, 1);
    localStorage.setItem('chatify_trusted', JSON.stringify(State.trustedPeers));
};

export const updateSettings = (newSettings) => {
    State.settings = { ...State.settings, ...newSettings };
    localStorage.setItem('chatify_settings', JSON.stringify(State.settings));
    
    const root = document.documentElement;
    const body = document.body;
    const theme = State.settings.theme || 'onyx';
    
    // Theme Application
    if(theme === 'pearl') {
        root.setAttribute('data-theme', 'light');
        root.classList.remove('dark');
    } else {
        root.removeAttribute('data-theme');
        root.classList.add('dark');
    }

    // Body classes (ensure body exists)
    if(body) {
        body.classList.toggle('stealth-mode', !!State.settings.stealthMode);
        
        // Font Scaling
        if(State.settings.fontSize === 'small') body.style.fontSize = '13px';
        else if(State.settings.fontSize === 'large') body.style.fontSize = '17px';
        else body.style.fontSize = '15px';
    }

    if(window.lucide) lucide.createIcons();
};
