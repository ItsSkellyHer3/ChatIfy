# Changelog

All notable changes to Chatify will be documented in this file.

## [13.1.0] - 2026-02-16

### Major Overhaul
- **Architecture**: Completely rewrote `Chat` logic to separate data loading from UI rendering.
- **UI Redesign**: Replaced legacy layout with a modern, high-end "Clean" aesthetic. Removed all sidebar clutter and focused on content.
- **Theme Engine**: Fixed theme persistence and toggling logic. Added direct `Pearl` (Light) and `Onyx` (Dark) mode support.
- **Navigation**: Simplified sidebar to "Menu", "Channels", and "People". Removed "Workspace" jargon.

### Fixed
- **Overview Loading**: Fixed bug where the "Getting Started" screen would get stuck in a loading state. It now renders a dedicated client-side view.
- **Message Sending**: Fixed race conditions in message sending and temp message generation.
- **Replies**: Fixed "Replied to" rendering logic to correctly link and display the original message.
- **Reactions**: Implemented real-time reaction updates and fixed the missing `addReaction` API call.

### Added
- **Floating Input**: New floating input bar with blur effect and smoother animations.
- **Animations**: Added `animate-fade-up` and `animate-fade-in` for smoother transitions.
- **Settings Overlay**: Settings are now a clean overlay instead of a jarring page switch (visually improved).

### Security
- **Data Volatility**: Verified and enhanced the 60-minute auto-purge logic.
- **Sanitization**: hardened message input handling.
