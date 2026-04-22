const cron   = require('node-cron');
const Store  = require('../models/Store');
const logger = require('../config/logger');

const startSubscriptionCron = () => {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Checking for expired subscriptions...');
    try {
      const result = await Store.updateMany(
        {
          isActive:              true,
          subscriptionExpiresAt: { $ne: null, $lt: new Date() },
        },
        { $set: { isActive: false } }
      );
      logger.info({ deactivated: result.modifiedCount }, 'Subscription cron completed');
    } catch (err) {
      logger.error(err, 'Subscription cron failed');
    }
  });

  logger.info('Subscription expiration job scheduled (daily 00:00)');
};

module.exports = { startSubscriptionCron };
