import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/environment.js';

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const app = createApp();

  const server = app.listen(ENV.PORT, () => {
    console.log(`🚀 Async Health API Server running in [${ENV.NODE_ENV}] mode on port ${ENV.PORT}`);
    console.log(`🔗 Health Check: http://localhost:${ENV.PORT}/api/health`);
  });

  // Graceful shutdown
  const handleShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('💤 HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
