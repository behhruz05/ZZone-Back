require('dotenv').config();

const app       = require('./app');
const connectDB = require('./src/config/db');
const { startSubscriptionCron } = require('./src/jobs/subscription.cron');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  startSubscriptionCron();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

start();
