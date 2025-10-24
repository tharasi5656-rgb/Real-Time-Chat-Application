// server.js 
const express = require('express'); const http = require('http'); const path = require('path'); const { Server } = require('socket.io'); 
 
const app = express(); 
const server = http.createServer(app); const io = new Server(server); 
 
// Serve static files from /public 
app.use(express.static(path.join(__dirname, 'public'))); 
 
// In-memory store (no DB) — keep small history const MAX_HISTORY = 200; let messageHistory = []; 
let users = {}; // socketId -> username 
 
io.on('connection', (socket) => { 
  console.log('socket connected:', socket.id); 
 
  // send current users + history to the new client   socket.emit('init', {     history: messageHistory,     users: Object.values(users) 
  }); 
 
  // new user joined with chosen name   socket.on('join', (username) => { 
    username = (username || 'Anonymous').trim().slice(0, 32);     users[socket.id] = username;     // broadcast user list update 
    io.emit('users', Object.values(users)); 
    // announce join     const joinMsg = {       system: true, 
      text: `${username} joined the chat`,       ts: Date.now() 
    }; 
    pushHistory(joinMsg);     io.emit('message', joinMsg); 
  }); 
 
  // incoming chat message   socket.on('message', (text) => { 
    const username = users[socket.id] || 'Anonymous';     const msg = {       system: false,       user: username, 
      text: (text || '').toString().slice(0, 1000),       ts: Date.now() 
    }; 
    pushHistory(msg); 
    io.emit('message', msg); // broadcast to all 
  }); 
 
  // typing indicator 
  socket.on('typing', (isTyping) => { 
    const username = users[socket.id] || 'Anonymous';     socket.broadcast.emit('typing', { username, isTyping }); 
  });    socket.on('disconnect', () => {     const username = users[socket.id];     if (username) { 
      delete users[socket.id];       // broadcast user list update       io.emit('users', Object.values(users));       const leaveMsg = {         system: true, 
        text: `${username} left the chat`,         ts: Date.now() 
      }; 
      pushHistory(leaveMsg);       io.emit('message', leaveMsg); 
    } 
    console.log('socket disconnected:', socket.id); 
  }); 
}); 
 
// Helper to keep limited history function pushHistory(msg) {   messageHistory.push(msg); 
  if (messageHistory.length > MAX_HISTORY) messageHistory.shift(); 
}  const PORT = process.env.PORT || 3000; server.listen(PORT, () => {   console.log(`Server running on http://localhost:${PORT}`); }); 
 
 
