# Multi-Window Media Sequencer

A web-based media sequencing and synchronization system built using React, Golang, and MySQL.

The application provides multiple display windows where each window plays its own configured media playlist continuously. A synchronization action can temporarily display the same selected media across all windows and then return each window to its normal playlist.

---

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

---

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

### Development Tools
- Git
- GitHub
- Postman
- MySQL Workbench

---

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