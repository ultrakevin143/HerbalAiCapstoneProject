import app from './app.js';
import { ENV } from './config/env.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { verifyAccessToken } from './utils/jwt.js';

const httpServer = createServer(app);

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((res, item) => {
    const [name, ...rest] = item.trim().split('=');
    if (name && rest.length > 0) {
      res[name] = decodeURIComponent(rest.join('='));
    }
    return res;
  }, {} as Record<string, string>);
};

export const io = new Server(httpServer, {
  cors: {
    origin: ENV.FRONTEND_URL,
    credentials: true,
  },
});

// Socket.io middleware to verify and authenticate connected users
io.use((socket, next) => {
  const token =
    (socket.handshake.auth && socket.handshake.auth.token) ||
    parseCookies(socket.handshake.headers.cookie)['accessToken'];

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      socket.data.user = payload;
      socket.data.userId = payload.userId;
    }
  }
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Automatically join private room if user is authenticated
  if (socket.data.userId) {
    socket.join(socket.data.userId);
    console.log(`👤 Authenticated user ${socket.data.userId} auto-joined private room`);
  }

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});


const startServer = () => {
  try {
    httpServer.listen(ENV.PORT, () => {
      console.log('--------------------------------------------------');
      console.log(`🚀 ${ENV.APP_NAME} started successfully!`);
      console.log(`📡 URL: ${ENV.BACKEND_URL}`);
      console.log(`🌍 MODE: ${ENV.NODE_ENV}`);
      console.log(`🔌 WebSockets enabled`);
      console.log('--------------------------------------------------');
    });
  } catch (error) {
    console.error('❌ CRITICAL: Could not start the engine:', error);
    process.exit(1);
  }
};

startServer();
