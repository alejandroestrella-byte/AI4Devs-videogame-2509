# Castlevania Clone

A lightweight Castlevania-style game built with Phaser 3.

## Running the Game

**Important:** Due to browser CORS restrictions, you cannot open the HTML file directly. You must run a local web server.

### Option 1: Using the Python Server Script (Recommended)

1. Navigate to the `castlevania-clone` directory
2. Run the server:
   ```bash
   python3 server.py
   ```
3. The game will automatically open in your browser at `http://localhost:8000/index.html`

### Option 2: Using Python's Built-in Server

1. Navigate to the `castlevania-clone` directory
2. Run:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and go to `http://localhost:8000/index.html`

### Option 3: Using Node.js (if installed)

1. Install `http-server` globally:
   ```bash
   npm install -g http-server
   ```
2. Navigate to the `castlevania-clone` directory
3. Run:
   ```bash
   http-server -p 8000
   ```
4. Open your browser and go to `http://localhost:8000/index.html`

## Controls

- **Arrow Keys**: Move left/right and jump
- **Space**: Attack (coming soon)

## Assets

- `assets/images/`: Contains game sprites and backgrounds
- `assets/audio/`: Contains sound effects and music (coming soon)

