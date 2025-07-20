import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT || 5000;

let onlineUsers = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join', (username) => {
    onlineUsers[socket.id] = username;
    io.emit('onlineUsers', Object.values(onlineUsers));
    io.emit('notification', `${username} joined the chat`);
  });

  socket.on('chatMessage', ({ username, message }) => {
    const timestamp = new Date().toISOString();
    io.emit('chatMessage', { username, message, timestamp });
  });

  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  socket.on('stopTyping', () => {
    socket.broadcast.emit('stopTyping');
  });

  socket.on('disconnect', () => {
    const username = onlineUsers[socket.id];
    delete onlineUsers[socket.id];
    io.emit('onlineUsers', Object.values(onlineUsers));
    io.emit('notification', `${username} left the chat`);
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
