# Changelog

All notable changes to Chatify will be documented in this file.

## [13.0.7] - 2026-02-16

### Fixed
- **Theme Engine**: Resolved issue where theme selection in `index.html` wouldn't persist or apply correctly due to `document.body` checks.
- **Message UI**: Fixed "Replied to" messages not rendering correctly in the feed.
- **Reactions**: Implemented missing `API.addReaction` method and fixed real-time reaction updates.
- **Navigation**: Cleaned up terminology across the dashboard (e.g., "Workspace" -> "Channels").
- **UI Stability**: Fixed various layout bugs in `chat.html` for both mobile and desktop.

### Added
- **Module Separation**: Improved code organization between `chat.js`, `ui.js`, and `navigation.js`.
- **Better Animations**: Added smoother transitions for messages and theme switching.
- **Theme Selection**: Added explicit Light/Dark choice on the landing page before joining.

### Security
- **Data Volatility**: Enhanced ephemeral cache purging logic in the Python backend.
- **Sanitization**: Improved DOMPurify integration for all message content.
