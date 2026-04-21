const cron  = require('node-cron');
const Store = require('../models/Store');

/**
 * Daily cron job: deactivates stores with expired subscriptions.
 * Runs every day at 00:00 (midnight) server time.
 *
 * Uses a single updateMany for efficiency — no N+1 queries.
 */
const startSubscriptionCron = () => {
  // Cron expression: minute hour day month weekday
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Checking for expired subscriptions...');
    try {
      const result = await Store.updateMany(
        {
          isActive:              true,
          subscriptionExpiresAt: { $ne: null, $lt: new Date() },
        },
        { $set: { isActive: false } }
      );
      console.log(`[CRON] Deactivated ${result.modifiedCount} store(s)`);
    } catch (err) {
      console.error('[CRON] Subscription check failed:', err.message);
    }
  });

  console.log('[CRON] Subscription expiration job scheduled (daily 00:00)');
};

module.exports = { startSubscriptionCron };
