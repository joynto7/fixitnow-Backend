import { app } from './app';
import { config } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(config.port, () => {
  console.log(`FixItNow API listening on port ${config.port} (${config.nodeEnv})`);
  console.log(`API docs available at ${config.baseUrl}/api-docs`);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
