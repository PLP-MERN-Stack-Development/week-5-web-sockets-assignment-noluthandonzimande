import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Change URL if deployed

export default function App() {
  const [username, setUsername] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);

  const messageEndRef = useRef(null);

  useEffect(() => {
    socket.on('chatMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('notification', (note) => {
      setMessages((prev) => [...prev, { username: 'System', message: note, timestamp: new Date().toISOString() }]);
    });

    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    socket.on('typing', (user) => {
      setTypingUser(user);
    });

    socket.on('stopTyping', () => {
      setTypingUser(null);
    });

    return () => {
      socket.off('chatMessage');
      socket.off('notification');
      socket.off('onlineUsers');
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = () => {
    if (username.trim()) {
      socket.emit('join', username);
      setLoggedIn(true);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      socket.emit('chatMessage', { username, message });
      setMessage('');
      socket.emit('stopTyping');
    }
  };

  let typingTimeout;
  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', username);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('stopTyping');
    }, 1000);
  };

  if (!loggedIn) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Enter your username to join chat</h2>
        <input
          type="text"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        <button onClick={handleLogin}>Join Chat</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2>Global Chat Room</h2>
      <div>
        <strong>Online Users:</strong> {onlineUsers.join(', ')}
      </div>
      <div
        style={{
          border: '1px solid #ccc',
          height: 400,
          overflowY: 'scroll',
          marginTop: 10,
          padding: 10,
          background: '#f9f9f9',
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong>{msg.username}</strong> [{new Date(msg.timestamp).toLocaleTimeString()}]: {msg.message}
          </div>
        ))}
        {typingUser && <div><em>{typingUser} is typing...</em></div>}
        <div ref={messageEndRef} />
      </div>
      <input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={handleTyping}
        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        style={{ width: '100%', marginTop: 10, padding: 10 }}
      />
      <button onClick={handleSendMessage} style={{ marginTop: 10 }}>
        Send
      </button>
    </div>
  );
}
