const cron               = require('node-cron');
const { fetchAndSave }   = require('../services/olx.service');
const logger             = require('../config/logger');

const startOlxCron = () => {
  // Runs every 6 hours: at minute 0, every 6th hour
  cron.schedule('0 */6 * * *', async () => {
    logger.info('OLX cron: starting auto listings sync...');
    try {
      const stats = await fetchAndSave();
      logger.info(stats, 'OLX cron: sync completed');
    } catch (err) {
      logger.error(err, 'OLX cron: sync failed');
    }
  });

  logger.info('OLX auto listings sync job scheduled (every 6 hours)');
};

module.exports = { startOlxCron };
