import app from './app.js';
import { ENV } from './config/env.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { verifyAccessToken } from './utils/jwt.js';
import { closeDatabasePool, warmDatabasePool } from './lib/prisma.js';
import { listen } from './lib/listen.js';

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

  socket.on('forum:join', (threadId: unknown) => {
    if (Number.isSafeInteger(threadId) && Number(threadId) > 0) {
      socket.join(`forum:thread:${threadId}`);
    }
  });

  socket.on('forum:leave', (threadId: unknown) => {
    if (Number.isSafeInteger(threadId) && Number(threadId) > 0) {
      socket.leave(`forum:thread:${threadId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});


const startServer = async () => {
  try {
    // Pay the remote database connection cost before readiness instead of on the
    // first user's authenticated request. This does not cache user data.
    await warmDatabasePool();
    await listen(httpServer, ENV.PORT);
    console.log('--------------------------------------------------');
    console.log(`🚀 ${ENV.APP_NAME} started successfully!`);
    console.log(`📡 URL: ${ENV.BACKEND_URL}`);
    console.log(`🌍 MODE: ${ENV.NODE_ENV}`);
    console.log(`🔌 WebSockets enabled`);
    console.log('--------------------------------------------------');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      console.error(`Port ${ENV.PORT} is already in use. Stop the existing backend or preview before starting another instance.`);
    } else {
      console.error('❌ CRITICAL: Could not start the engine:', error);
    }
    const exitTimer = setTimeout(() => process.exit(1), 5_000);
    exitTimer.unref();
    io.close();
    try {
      await closeDatabasePool();
    } catch (cleanupError) {
      console.error('Failed to close the database pool after startup failure:', cleanupError);
    }
    process.exit(1);
  }
};

startServer();

let shuttingDown = false;
const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ event: 'server_shutdown', signal }));
  io.close();
  httpServer.close(async () => {
    try {
      await closeDatabasePool();
      process.exit(0);
    } catch (error) {
      console.error('Failed to close the database pool cleanly:', error);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
