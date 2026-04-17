const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// In-memory data store
const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', ({ roomId, userName }) => {
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        participants: [],
        isRevealed: false,
        adminId: socket.id,
        storyTitle: '',
        history: []
      };
    }

    // Check if participant already exists in the room
    const existingParticipant = rooms[roomId].participants.find(p => p.id === socket.id);
    if (!existingParticipant) {
      rooms[roomId].participants.push({
        id: socket.id,
        name: userName,
        vote: null,
        isAdmin: rooms[roomId].adminId === socket.id
      });
    }

    console.log(`${userName} joined room ${roomId}`);
    io.to(roomId).emit('room_update', rooms[roomId]);
  });

  socket.on('update_story', ({ roomId, title }) => {
    if (rooms[roomId]) {
      rooms[roomId].storyTitle = title;
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  });

  socket.on('confirm_estimation', ({ roomId, average }) => {
    if (rooms[roomId]) {
      rooms[roomId].history.push({
        title: rooms[roomId].storyTitle || 'Unnamed Story',
        estimate: average,
        timestamp: new Date().toISOString()
      });
      rooms[roomId].isRevealed = false;
      rooms[roomId].storyTitle = '';
      rooms[roomId].participants.forEach(p => p.vote = null);
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  });

  socket.on('cast_vote', ({ roomId, vote }) => {
    if (rooms[roomId]) {
      const participant = rooms[roomId].participants.find(p => p.id === socket.id);
      if (participant) {
        participant.vote = vote;
        console.log(`User ${participant.name} voted ${vote} in room ${roomId}`);
        io.to(roomId).emit('room_update', rooms[roomId]);
      }
    }
  });

  socket.on('reveal_votes', (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].isRevealed = true;
      console.log(`Votes revealed in room ${roomId}`);
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  });

  socket.on('reset_votes', (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].isRevealed = false;
      rooms[roomId].participants.forEach(p => p.vote = null);
      console.log(`Votes reset in room ${roomId}`);
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (rooms[roomId]) {
        rooms[roomId].participants = rooms[roomId].participants.filter(p => p.id !== socket.id);
        
        // Remove room if empty
        if (rooms[roomId].participants.length === 0) {
          delete rooms[roomId];
        } else {
          // Reassign admin if the admin left
          if (rooms[roomId].adminId === socket.id) {
            rooms[roomId].adminId = rooms[roomId].participants[0].id;
            rooms[roomId].participants[0].isAdmin = true;
          }
          io.to(roomId).emit('room_update', rooms[roomId]);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Planning Poker Server running on port ${PORT}`);
});
