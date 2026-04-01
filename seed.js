require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Store = require('./src/models/Store');
const Product = require('./src/models/Product');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  await User.deleteMany({});
  await Store.deleteMany({});
  await Product.deleteMany({});
  console.log('Old data cleared');

  // --- USERS ---
  // Parolni raw beramiz, model o'zi hash qiladi (pre-save hook)
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@zzone.uz',
    password: 'password123',
    role: 'ADMIN',
    balance: 0,
  });

  const seller1 = await User.create({
    name: 'Toshkent Avtozapchast',
    email: 'toshkent@zzone.uz',
    password: 'password123',
    role: 'SELLER',
    balance: 500000,
  });

  const seller2 = await User.create({
    name: 'Samarqand Motors',
    email: 'samarqand@zzone.uz',
    password: 'password123',
    role: 'SELLER',
    balance: 300000,
  });

  const seller3 = await User.create({
    name: 'Fergana Zapchast',
    email: 'fergana@zzone.uz',
    password: 'password123',
    role: 'SELLER',
    balance: 100000,
  });

  const client1 = await User.create({
    name: 'Jasur Xaridor',
    email: 'jasur@zzone.uz',
    password: 'password123',
    role: 'CLIENT',
  });

  const client2 = await User.create({
    name: 'Sherzod Xaridor',
    email: 'sherzod@zzone.uz',
    password: 'password123',
    role: 'CLIENT',
  });

  console.log('Users created');

  // --- STORES ---
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const store1 = await Store.create({
    seller: seller1._id,
    name: 'Toshkent Avtozapchast',
    description: 'Barcha rusumli avtomobillar uchun original va analog ehtiyot qismlar',
    subscriptionPlan: 'PREMIUM',
    subscriptionExpiresAt: expires,
    isActive: true,
  });

  const store2 = await Store.create({
    seller: seller2._id,
    name: 'Samarqand Motors',
    description: 'Dvigatel, transmissiya va kuzov ehtiyot qismlari',
    subscriptionPlan: 'STANDARD',
    subscriptionExpiresAt: expires,
    isActive: true,
  });

  const store3 = await Store.create({
    seller: seller3._id,
    name: 'Fergana Zapchast',
    description: 'Arzon narxlarda sifatli avtozapchastlar',
    subscriptionPlan: 'BASIC',
    subscriptionExpiresAt: expires,
    isActive: true,
  });

  console.log('Stores created');

  // --- PRODUCTS ---
  const products = [
    // Toshkent Avtozapchast
    { store: store1._id, seller: seller1._id, name: 'Moy filtri (Nexia 3)', description: 'Original, Daewoo Nexia 3 uchun moy filtri', price: 35000, category: 'Filtrlar', status: 'APPROVED' },
    { store: store1._id, seller: seller1._id, name: 'Havo filtri (Cobalt)', description: 'Chevrolet Cobalt uchun havo filtri, original', price: 45000, category: 'Filtrlar', status: 'APPROVED' },
    { store: store1._id, seller: seller1._id, name: 'Tormoz kolodkasi (Lacetti)', description: 'Lacetti old tormoz kolodkasi, 1 to\'plam', price: 120000, category: 'Tormoz tizimi', status: 'APPROVED' },
    { store: store1._id, seller: seller1._id, name: 'Akkumulator 60Ah', description: 'Varta Silver, 60Ah, barcha rusumlar uchun', price: 850000, category: 'Akkumulator', status: 'APPROVED' },
    { store: store1._id, seller: seller1._id, name: 'Moy (Castrol 5W-40, 4L)', description: 'Castrol Edge 5W-40, sintetika, 4 litr', price: 280000, category: 'Moy va suyuqliklar', status: 'APPROVED' },
    { store: store1._id, seller: seller1._id, name: 'Spark momiq sham (NGK)', description: 'NGK B6EB, 1 dona, universal', price: 28000, category: 'Dvigatel', status: 'APPROVED' },

    // Samarqand Motors
    { store: store2._id, seller: seller2._id, name: 'Suv nasosi (Matiz)', description: 'Daewoo Matiz uchun suv nasosi', price: 95000, category: 'Sovutish tizimi', status: 'APPROVED' },
    { store: store2._id, seller: seller2._id, name: 'Gaz trosigi (Nexia)', description: 'Nexia 1/2 uchun gaz pedali trosigi', price: 42000, category: 'Dvigatel', status: 'APPROVED' },
    { store: store2._id, seller: seller2._id, name: 'Amortizator (Damas, old)', description: 'Daewoo Damas old amortizatori, 1 dona', price: 185000, category: 'Osma tizimi', status: 'APPROVED' },
    { store: store2._id, seller: seller2._id, name: 'Rulь nasos kammeri (Lacetti)', description: 'Lacetti gidroruль kammeri', price: 320000, category: 'Rulь tizimi', status: 'APPROVED' },
    { store: store2._id, seller: seller2._id, name: 'Termostat (Cobalt)', description: 'Chevrolet Cobalt termostat, 87°C', price: 65000, category: 'Sovutish tizimi', status: 'APPROVED' },

    // Fergana Zapchast
    { store: store3._id, seller: seller3._id, name: 'Tormoz disk (Gentra)', description: 'Chevrolet Gentra old tormoz diski', price: 210000, category: 'Tormoz tizimi', status: 'APPROVED' },
    { store: store3._id, seller: seller3._id, name: 'Shamol qayishi (Nexia 3)', description: 'Nexia 3 generator qayishi', price: 55000, category: 'Dvigatel', status: 'APPROVED' },
    { store: store3._id, seller: seller3._id, name: 'Antigrez (1L, FELIX)', description: 'FELIX Carbox, qizil, -40°C, 1 litr', price: 38000, category: 'Moy va suyuqliklar', status: 'APPROVED' },
    { store: store3._id, seller: seller3._id, name: 'Tormoz suyuqligi DOT-4 (0.5L)', description: 'LuKoil DOT-4, 0.5 litr', price: 22000, category: 'Moy va suyuqliklar', status: 'APPROVED' },
  ];

  await Product.insertMany(products);
  console.log('Products created');

  console.log('\n=== SEED COMPLETED ===');
  console.log('Admin:   admin@zzone.uz     / password123');
  console.log('Seller1: toshkent@zzone.uz  / password123');
  console.log('Seller2: samarqand@zzone.uz / password123');
  console.log('Seller3: fergana@zzone.uz   / password123');
  console.log('Client:  jasur@zzone.uz     / password123');

  await mongoose.disconnect();
};

seed().catch((err) => { console.error(err); process.exit(1); });
