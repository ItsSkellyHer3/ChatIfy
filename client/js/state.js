export const State = {
    user: JSON.parse(localStorage.getItem('chatify_user')) || null,
    activeChannel: null,
    socket: null,
    isTyping: false,
    replyingTo: null,
    trustedPeers: JSON.parse(localStorage.getItem('chatify_trusted')) || [],
    settings: JSON.parse(localStorage.getItem('chatify_settings')) || {
        theme: 'onyx', // onyx or pearl
        notifications: true,
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
    location.href = '/';
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
    
    const theme = State.settings.theme || 'onyx';
    
    // Apply Theme
    if(theme === 'pearl') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.add('dark');
    }

    // Stealth Mode Class
    body.classList.toggle('stealth-mode', !!State.settings.stealthMode);
    
    // Theme scale
    if(State.settings.fontSize === 'small') body.style.fontSize = '12px';
    else if(State.settings.fontSize === 'large') body.style.fontSize = '18px';
    else body.style.fontSize = '15px';

    // Reload Lucide for any new icons if needed
    if(window.lucide) lucide.createIcons();
};

function isLight(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128;
}
