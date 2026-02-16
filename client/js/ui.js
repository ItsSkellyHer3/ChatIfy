import { Navigation } from './modules/navigation.js';
import { Settings } from './modules/settings.js';

export const UI = {
    init: function() {
        Navigation.init();
        Settings.init();
    },

    toggleSidebar: function() {
        Navigation.toggleSidebar();
    },

    toggleSettings: function(show) {
        Settings.toggle(show);
    },

    renderSettings: function(tab) {
        Settings.render(tab);
    },

    renderUsers: function() {
        Navigation.renderUsers();
    }
};

window.UI = UI;
