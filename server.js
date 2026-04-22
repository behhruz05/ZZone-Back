require('dotenv').config();

const app       = require('./app');
const connectDB = require('./src/config/db');
const logger    = require('./src/config/logger');
const { startSubscriptionCron } = require('./src/jobs/subscription.cron');

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  startSubscriptionCron();
  app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server started');
  });
};

start().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
