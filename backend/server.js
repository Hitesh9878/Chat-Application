import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.js';
import messageRoutes from './src/routes/messages.js';
import userRoutes from './src/routes/user.routes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import { errorHandler, notFound } from './src/middlewares/errorHandler.js';
import { initializeSocket } from './src/sockets/index.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration - PRODUCTION READY
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://lovebirds-six.vercel.app',
  'http://localhost:3001'
].filter(Boolean); // Remove undefined values

console.log('🌐 CORS allowed origins:', allowedOrigins);

app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn('⚠️ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        message: 'Chat API is running...',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date(),
        version: '2.0.0',
        features: [
            'Chat Requests',
            'Block Users',
            'Incognito Mode',
            'Real-time Messaging',
            'File Sharing',
            'Video Calls'
        ]
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Chat API Server is Running',
        version: '2.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            messages: '/api/messages',
            users: '/api/users',
            upload: '/api/upload'
        }
    });
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Configure Socket.IO - PRODUCTION READY
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    path: '/socket.io/',
    allowEIO3: true
});

// Initialize socket handlers
initializeSocket(io);

// Server error handling
server.on('error', (err) => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        process.exit(1);
    }
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('⚠️ Forcing shutdown...');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log('\n' + '='.repeat(70));
    console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`📁 Uploads: http://localhost:${PORT}/uploads/`);
    console.log('\n🎯 Features: Chat Requests | Block | Incognito | Real-time | Files | Video');
    console.log('='.repeat(70) + '\n');
});

export default app;
