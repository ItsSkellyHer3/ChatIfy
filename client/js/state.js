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

export const updateSettings = (newSettings) => {
    State.settings = { ...State.settings, ...newSettings };
    localStorage.setItem('chatify_settings', JSON.stringify(State.settings));
    
    const root = document.documentElement;
    const body = document.body;
    const theme = State.settings.theme || 'onyx';
    
    // Strict Theme Application
    if(theme === 'pearl') {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
    } else {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
    }

    if(body) {
        body.classList.toggle('stealth-mode', !!State.settings.stealthMode);
        // Font Scaling
        if(State.settings.fontSize === 'small') body.style.fontSize = '14px';
        else if(State.settings.fontSize === 'large') body.style.fontSize = '18px';
        else body.style.fontSize = '16px';
    }

    if(window.lucide) lucide.createIcons();
};
