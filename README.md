# Multi-Window Media Sequencer

A web-based media sequencing and synchronization system built using React, Golang, and MySQL.

The application provides multiple display windows where each window plays its own configured media playlist continuously. A synchronization action can temporarily display the same selected media across all windows and then return each window to its normal sequence.

## Live Demo

- Frontend: https://media-sequencer-frontend-878f.onrender.com
- Backend: https://media-sequencer-api-mmdd.onrender.com
- Health Check: https://media-sequencer-api-mmdd.onrender.com/api/health

## Features

- Multiple independent media windows
- Individual playlist for each window
- Continuous image playback
- Continuous video playback
- Blank media support
- Configurable media duration
- Dynamic media addition to playlists
- Playlist refresh after media changes
- Synchronized playback across all windows
- Configurable synchronization duration
- Automatic return to individual playlists after synchronization
- Persistent MySQL database
- REST APIs using Golang
- React-based frontend
- Responsive user interface

## Tech Stack

### Frontend
- React
- JavaScript
- JSX
- CSS
- Vite

### Backend
- Golang
- Gin Web Framework
- REST APIs

### Database
- MySQL

### Development and Deployment Tools
- Git
- GitHub
- Postman
- MySQL Workbench
- Render
- Aiven MySQL

## Project Structure

```text
media-sequencer/
│
├── backend/
│   ├── main.go
│   ├── go.mod
│   ├── go.sum
│   │
│   ├── database/
│   │   └── database.go
│   │
│   ├── handlers/
│   │   ├── window_handler.go
│   │   ├── playlist_handlers.go
│   │   ├── sync_handler.go
│   │   └── media_handler.go
│   │
│   └── models/
│       └── models.go
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   │
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
│
└── README.md
```

## How It Works

Each display window has its own playlist stored in the MySQL database.

The frontend fetches the playlist from the Golang backend and plays each media item according to its configured duration.

After the last item finishes, the playlist starts again from the beginning, allowing continuous playback.

The application supports image, video, and blank media types.

### Playlist Management

Each playlist is associated with a specific display window.

A playlist item contains:
- Media
- Position
- Duration
- Media type
- Media URL

New media can be added to a window using the Add Media option.

After adding media, the frontend refreshes the playlist so the updated configuration is reflected without restarting the application.

### Synchronization

The application supports temporary synchronized playback across all display windows.

When Sync Current is triggered:
1. A selected media item is sent to the backend.
2. The backend stores the synchronization state in MySQL.
3. The synchronization start time and duration are stored.
4. The frontend detects the active synchronization state.
5. All windows temporarily display the same media.
6. After the configured synchronization duration expires, synchronization becomes inactive.
7. Each window returns to its own configured playlist.

The original playlist configuration is not deleted or modified during synchronization.

### Continuous Playback and 5-Hour Cycle

Each display window is treated as operating within a 5-hour playback cycle.

The configured playlist is repeated continuously throughout the operating cycle.

Example:

```
Window 1
M1 → M2 → M3 → M5 → M1 → M2 → ...

Window 2
M4 → M5 → M2 → M4 → M5 → ...

Window 3
M2 → M3 → M5 → M2 → ...

Window 4
M1 → M5 → M4 → M1 → ...
```

A blank screen is displayed only when a blank media item is explicitly configured in the playlist. The application does not automatically insert blank time when the configured playlist duration is shorter than the operating cycle.

## Database

The application uses MySQL for persistent storage.

### windows
Stores display window information.

| Column | Description |
|---|---|
| id | Window ID |
| name | Window name |
| created_at | Creation timestamp |

### media
Stores available media.

| Column | Description |
|---|---|
| id | Media ID |
| name | Media name |
| type | image / video / blank |
| url | Media URL |
| duration | Playback duration |

### playlists
Stores media assigned to each window.

| Column | Description |
|---|---|
| id | Playlist record ID |
| window_id | Associated window |
| media_id | Associated media |
| position | Playlist position |

### sync_state
Stores the current synchronization state.

| Column | Description |
|---|---|
| id | Sync state ID |
| media_id | Synchronized media |
| duration | Synchronization duration |
| started_at | Synchronization start time |
| is_active | Synchronization status |

## API Documentation

### Health Check
```
GET /api/health
```
Checks whether the backend is running.

### Get Windows
```
GET /api/windows
```
Returns all configured display windows.

### Get Available Media
```
GET /api/media
```
Returns all available media items.

### Get Window Playlist
```
GET /api/windows/:id/playlist
```
Returns the playlist configured for a specific window.

Example:
```
GET /api/windows/2/playlist
```

### Add Media to Playlist
```
POST /api/windows/:id/media
```
Request body:
```json
{
  "media_id": 5
}
```
Adds an existing media item to a window playlist.

### Start Synchronization
```
POST /api/sync
```
Request body:
```json
{
  "media_id": 5,
  "duration": 30
}
```
Starts synchronized playback for the configured duration.

### Get Synchronization Status
```
GET /api/sync
```
Returns the current synchronization state.

## Local Setup

### Prerequisites

Install:
- Go
- Node.js
- MySQL
- MySQL Workbench
- Git

### Clone Repository
```bash
git clone https://github.com/poojaverma2911/media-sequencer.git
cd media-sequencer
```

### Backend Setup
```bash
cd backend
go mod download
```

Configure the following environment variables:
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`

Run the backend:
```bash
go run main.go
```

Backend normally runs at:
```
http://localhost:8080
```

### Frontend Setup

Open a new terminal and run:
```bash
cd frontend
npm install
```

Configure:
```
VITE_API_URL=http://localhost:8080/api
```

Run:
```bash
npm run dev
```

Frontend normally runs at:
```
http://localhost:5173
```

## Deployment

### Backend

The Golang backend is deployed on Render.

Production database credentials are provided through environment variables.

The backend uses the `PORT` environment variable provided by Render.

### Database

The production MySQL database is hosted using Aiven.

The database contains:
- windows
- media
- playlists
- sync_state

### Frontend

The React/Vite frontend is deployed as a static site on Render.

The production API URL is configured using:
```
VITE_API_URL
```

Production API:
```
https://media-sequencer-api-mmdd.onrender.com/api
```

## Assumptions

- Media URLs are externally accessible.
- Media duration is configured in seconds.
- Playlist order is determined by the position field.
- Each window continuously repeats its configured playlist.
- Synchronization temporarily overrides normal playback without modifying playlist configuration.
- Synchronization duration is controlled by the backend sync state.
- A blank display is shown only when blank media is explicitly configured.
- MySQL is used as persistent storage.
- The application requires internet access for externally hosted media URLs.

## Testing

The following functionality has been tested:
- Backend health check
- Window retrieval
- Media retrieval
- Individual playlist playback
- Image playback
- Video playback
- Continuous playlist looping
- Dynamic media addition
- Persistent playlist updates
- Synchronized playback
- Automatic return from synchronization
- Production MySQL connectivity
- Production frontend-backend communication

## Deployment URLs

Frontend:
```
https://media-sequencer-frontend-878f.onrender.com
```

Backend:
```
https://media-sequencer-api-mmdd.onrender.com
```

Health Check:
```
https://media-sequencer-api-mmdd.onrender.com/api/health
```

## Repository

https://github.com/poojaverma2911/media-sequencer
