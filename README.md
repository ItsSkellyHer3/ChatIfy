# 🗨️ Chatify | Monochrome Open Source Workspace

[![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](https://opensource.org/licenses/MIT)
[![Architect: ItsSkellyHer3](https://img.shields.io/badge/Architect-ItsSkellyHer3-black.svg)](https://github.com/ItsSkellyHer3)
[![Status: Open Source](https://img.shields.io/badge/Status-Open%20Source-white.svg)](#)

A high-performance, ephemeral messaging platform built for teams and individuals who value privacy, speed, and absolute simplicity. Designed with a sleek **Monochrome Aesthetic**, Chatify provides a professional workspace with zero persistence and end-to-end encryption.

---

## 🏛️ Architect
Developed and designed by **[ItsSkellyHer3](https://github.com/ItsSkellyHer3)**. Built for the community, by the community.

---

## ✨ Key Features

- **🌑 Monochrome UI:** A high-end, brutalist black-and-white design focused on clarity and focus.
- **🛡️ Privacy First:** No accounts, no cookies, and zero message persistence. Data lives in volatile memory and is purged every 60 minutes.
- **⚡ Real-time Sync:** Instant message delivery, file sharing, and typing indicators powered by Socket.io and FastAPI.
- **🎨 Dynamic Theming:** Seamlessly switch between **Onyx (Dark)** and **Pearl (Light)** modes with high-contrast optimization.
- **📦 Open Source:** Fully MIT Licensed. Host it yourself, modify it, and contribute to the evolution of private messaging.
- **📎 Media Sharing:** Share files and images instantly with automatic secure cleanup.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Python 3.12+
- SQLite (included)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ItsSkellyHer3/ChatIfy.git
   cd ChatIfy
   ```

2. **Install Node Dependencies**
   ```bash
   npm install
   ```

3. **Setup Python Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Run the Application**
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

The application will be available at `http://localhost:3000`.

---

## 🛠️ Tech Stack

- **Frontend:** React-style Vanilla JS, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js (Proxy), FastAPI (Python), SQLAlchemy.
- **Real-time:** Socket.io (Bi-directional transmission).
- **Database:** SQLite (Ephemeral message storage).

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🤝 Community

Chatify is a living project. We welcome forks, contributions, and self-hosting enthusiasts. 

**Made with 🤍 by [ItsSkellyHer3](https://github.com/ItsSkellyHer3)**
