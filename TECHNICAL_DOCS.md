# Technical Documentation

This document outlines the architecture, configuration, and developer instructions for the Lil Emergency Display System.

## Architecture

The system is a single Node.js process running two separate Express applications on two different ports.
- **Screen Interface (Port 80 by default):** Serves the full-screen dynamic UI intended for Raspberry Pi displays.
- **Admin Interface (Port 8080 by default):** Serves the secured command center UI for operators.

### Server-Sent Events (SSE)
Real-time updates are achieved using Server-Sent Events rather than WebSockets. This provides a lightweight, robust, one-way communication channel from the server to the screens. Whenever a message is created, edited, deleted, or activated, the server broadcasts the entire JSON state of the database to all connected clients.

### Routing & Presets
- The screen app uses `app.use()` (a catch-all) instead of `app.get('*')` to ensure compatibility with Express 5 routing.
- If the screen accesses a specific path (e.g., `/fire`), the client-side JavaScript checks if `location.pathname` matches any preset slug. If it does, it displays that preset permanently. If not, or if accessed at the root `/`, it binds to the `activeId` state dynamically.

## Data Storage
- **Database:** All messages and state are stored in a simple flat-file JSON database at `./data/db.json`. This ensures zero external dependencies and extreme portability.
- **Uploads:** Background images uploaded via the admin panel are saved to `./uploads/` via `multer`. The admin app serves these statically, allowing the screens to render them.
- Both directories are mounted as Docker volumes, ensuring data persists across container restarts.

## Authentication
The admin interface uses a custom cookie-based authentication flow.
- A POST request to `/api/login` checks the provided password against `process.env.ADMIN_PASSWORD`.
- If successful, a strict, HTTP-only cookie (`auth`) is set containing the password hash/string.
- Admin middleware blocks access to `/api/*` and HTML routes unless the valid cookie is present.

## Configuration & Environment Variables
The application relies on `.env` for its runtime configuration:

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `SCREEN_PORT` | The port the display screens will access. | `80` |
| `ADMIN_PORT` | The port the admin panel will access. | `8080` |
| `ADMIN_PASSWORD` | The password required to login to the admin UI. | `(Empty/None)` |

## Docker
The provided `docker-compose.yml` automatically passes the `.env` variables to the container and binds the host ports to match. 

To rebuild the container after making changes to the source code:
```bash
docker-compose up -d --build
```
