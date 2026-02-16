# Chatify

![Chatify Preview](preview.png)

### [ 🌐 INTERACTIVE PREVIEW ](https://itsskellyher3.github.io/ChatIfy)
*Production-grade ephemeral workspace interface.*

A minimalist, high-performance messaging interface designed for ephemeral communication and absolute privacy. 

Developed and designed by **ItsSkellyHer3**, Chatify is an open-source workspace focusing on clean architecture, real-time synchronization, and zero-persistence data handling.

---

## Core Philosophy

Chatify is built on the principle of "Data Volatility." Unlike traditional messaging platforms, Chatify does not maintain long-term archives. All communications are stored in volatile memory and purged systematically every 60 minutes to ensure total privacy.

---

## Technical Specifications

- **Monochrome Interface:** A high-contrast, brutalist design focused on utility and focus.
- **Bi-directional Sync:** Real-time message transmission via Socket.io.
- **Stateless Persistence:** Integration with SQLite for short-term caching with automated cleanup cycles.
- **Architecture:** Node.js reverse proxy handling client assets and FastAPI (Python) managing the core messaging engine.
- **MIT Licensed:** Open-source architecture for inspection, forking, and self-hosting.

---

## Installation and Deployment

### System Requirements
- Node.js 18.0 or higher
- Python 3.12 or higher
- Linux/macOS preferred (Windows supported via WSL)

### Setup Procedure

1. **Clone the repository**
   ```bash
   git clone https://github.com/ItsSkellyHer3/ChatIfy.git
   cd ChatIfy
   ```

2. **Initialize Frontend Services**
   ```bash
   npm install
   ```

3. **Configure Python Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Execute Application**
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

The service will be accessible at `http://localhost:3000`.

---

## Project Structure

- `/client`: Modern Vanilla JS interface with Tailwind CSS implementation.
- `/server`: Node.js Express server acting as an API gateway.
- `/python_service`: FastAPI backend handling business logic and socket events.

---

## License

This project is licensed under the MIT License. Contributions and forks are encouraged.

---

## Release History

Detailed changes for each release are documented in the [CHANGELOG.md](CHANGELOG.md).

**Lead Architect:** [ItsSkellyHer3](https://github.com/ItsSkellyHer3)
