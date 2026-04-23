require('dotenv').config();

const app       = require('./app');
const connectDB = require('./src/config/db');
const logger    = require('./src/config/logger');
const { startSubscriptionCron } = require('./src/jobs/subscription.cron');
const { startOlxCron }          = require('./src/jobs/olx.cron');
const { fetchAndSave }          = require('./src/services/olx.service');

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();

  startSubscriptionCron();
  startOlxCron();

  app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server started');
  });

  // Initial OLX fetch — run in background so startup is not blocked
  fetchAndSave()
    .then((stats) => logger.info(stats, 'OLX: initial sync completed'))
    .catch((err)  => logger.error(err,  'OLX: initial sync failed'));
};

start().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
