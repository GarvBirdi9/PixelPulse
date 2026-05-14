# PixelPulse

A real-time, shared grid application where users can capture pixels and see changes instantly. Built to demonstrate real-time systems, UI excellence, and clean code architecture.

## Features

- **Real-Time Synchronization**: Every pixel capture is broadcasted to all users in milliseconds using WebSockets.
- **Dynamic Leaderboard**: Track the top "Pixel Lords" as they dominate the board.
- **Live Activity Feed**: A stream of recent captures to make the board feel alive.
- **Premium UI/UX**: Dark-mode aesthetic with HSL-based color systems, smooth scale animations, and glassmorphism.
- **Auto-Identity**: Users get unique randomized names and vibrant colors upon joining.

## Tech Stack

### Frontend
- **React (Vite)**: For a fast, component-based development loop.
- **Tailwind CSS**: Used for layout, spacing, and modern styling (Zinc/Emerald palette).
- **Socket.io-client**: Handles bidirectional communication with the server.

### Backend
- **Node.js + Express**: A lightweight, scalable foundation.
- **Socket.io**: Chosen for its robust reconnection logic and reliability over raw WebSockets.
- **In-Memory Store**: Data is held in the server's RAM for ultra-low latency updates.

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
Clone the repo and install dependencies for both the client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Running Locally
You'll need two terminal windows open:

**Terminal 1: Backend**
```bash
cd server
npm start
```

**Terminal 2: Frontend**
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`.

## Design Decisions & Trade-offs

- **Socket.io vs Raw WebSockets**: I chose Socket.io because it includes "heartbeats" and "automatic reconnection" out of the box. For a shared game, losing connection for a second shouldn't break the user experience.
- **In-Memory Storage**: I prioritized **speed** over permanent persistence. For this project, having zero-latency updates was more important than saving data across server restarts.
- **DOM-based Grid**: Instead of HTML5 Canvas, I used React components for each pixel. This allowed me to use **Tailwind transitions and hover scales** easily, which significantly improved the "feel" of the UI.
