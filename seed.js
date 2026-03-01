require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./src/models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Make behruz.admin ADMIN role
  const admin = await User.findOneAndUpdate(
    { email: 'behruz.admin@avtohub.uz' },
    { role: 'ADMIN' },
    { new: true }
  );
  console.log(`ADMIN role set: ${admin.name} (${admin.email}) → ${admin.role}`);

  // 2. Give seller 500,000 balance to test paid plans later
  const seller = await User.findOneAndUpdate(
    { email: 'alisher@avtohub.uz' },
    { balance: 500000 },
    { new: true }
  );
  console.log(`Seller balance set: ${seller.name} → ${seller.balance}`);

  await mongoose.disconnect();
  console.log('Done');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
