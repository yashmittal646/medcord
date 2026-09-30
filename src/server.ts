import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/environment.js';
import { ConsentService } from './services/consent.service.js';
import { ensureDoctorProfiles } from './services/doctorVerification.service.js';
import { ClassificationService } from './services/classification.service.js';
import { AccessRequestService } from './services/accessRequest.service.js';

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  await ensureDoctorProfiles().catch((e) => console.error('⚠️ Doctor profile repair failed:', e));
  await ClassificationService.backfillLegacyRecords().catch((e) => console.error('⚠️ Record backfill failed:', e));

  const app = createApp();

  // Housekeeping: record consent expiries in the audit trail and warn doctors before a grant lapses.
  // Access checks never rely on this; they compare expiresAt on every request.
  const sweep = () =>
    Promise.all([ConsentService.expireStale(), ConsentService.notifyExpiringSoon(), AccessRequestService.expireStale()]).catch(
      (e) => console.error('⚠️ Consent sweep failed:', e)
    );
  setInterval(sweep, 5 * 60 * 1000).unref();

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
