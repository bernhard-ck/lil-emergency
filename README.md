# Lil Emergency Display System

A highly responsive, offline-capable digital signage system for festivals and large events. This system allows administrators to control exactly what is displayed on large screens (e.g., Raspberry Pis running Yodeck) across a local network instantly.

## Documentation

- **[User Manual](USER_MANUAL.md)**: Instructions for operating the system, managing screens, and using the Admin interface.
- **[Technical Documentation](TECHNICAL_DOCS.md)**: Architecture, APIs, Docker setup, and developer notes.

## Quick Start

1. **Configure Environment:** Copy `.env.example` to `.env` and set your preferred ports and password.
   ```bash
   cp .env.example .env
   ```
2. **Deploy via Docker:** Build and start the container in the background.
   ```bash
   docker-compose up -d --build
   ```
3. **Access:**
   - Admin Panel: `http://localhost:8080` (or whatever `ADMIN_PORT` you set)
   - Screens: `http://localhost:80` (or whatever `SCREEN_PORT` you set)
