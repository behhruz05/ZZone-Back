require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./src/models/User');
const Store    = require('./src/models/Store');
const Product  = require('./src/models/Product');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  await User.deleteMany({});
  await Store.deleteMany({});
  await Product.deleteMany({});
  console.log('Old data cleared');

  // ─── USERS ────────────────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin', email: 'admin@zzone.uz',
    password: 'password123', role: 'ADMIN', balance: 0,
  });

  const [s1, s2, s3, s4, s5] = await Promise.all([
    User.create({ name: 'Toshkent Avtozapchast', email: 'toshkent@zzone.uz',   password: 'password123', role: 'SELLER', balance: 500000 }),
    User.create({ name: 'Samarqand Motors',       email: 'samarqand@zzone.uz',  password: 'password123', role: 'SELLER', balance: 300000 }),
    User.create({ name: 'Fergana Zapchast',        email: 'fergana@zzone.uz',    password: 'password123', role: 'SELLER', balance: 100000 }),
    User.create({ name: 'Mirzo Ulugbek Auto',      email: 'mirzo@zzone.uz',      password: 'password123', role: 'SELLER', balance: 250000 }),
    User.create({ name: 'Chilonzor Zapchast',      email: 'chilonzor@zzone.uz',  password: 'password123', role: 'SELLER', balance: 180000 }),
  ]);

  const [client1, client2] = await Promise.all([
    User.create({ name: 'Jasur Xaridor',  email: 'jasur@zzone.uz',  password: 'password123', role: 'CLIENT' }),
    User.create({ name: 'Sherzod Xaridor', email: 'sherzod@zzone.uz', password: 'password123', role: 'CLIENT' }),
  ]);

  console.log('Users created');

  // ─── STORES ───────────────────────────────────────────────────────────────
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 5 stores in different Tashkent districts
  const [st1, st2, st3, st4, st5] = await Promise.all([
    Store.create({
      seller: s1._id, name: 'Toshkent Avtozapchast',
      description: 'Barcha rusumli avtomobillar uchun original va analog ehtiyot qismlar. 10 yildan ortiq tajriba, kafolat bilan ishlаymiz.',
      subscriptionPlan: 'PREMIUM', subscriptionExpiresAt: expires, isActive: true,
      contacts: { phone: '+998901234567', telegram: 'toshkent_avto', instagram: 'toshkent_avtozapchast', whatsapp: '+998901234567' },
      location: { lat: 41.2856, lng: 69.2294, address: 'Chorsu bozori yaqini, Eski shahar' },
    }),
    Store.create({
      seller: s2._id, name: 'Samarqand Motors',
      description: 'Dvigatel, transmissiya va kuzov ehtiyot qismlari. Yunoniston va Koreya importi.',
      subscriptionPlan: 'STANDARD', subscriptionExpiresAt: expires, isActive: true,
      contacts: { phone: '+998712345678', telegram: 'samarqand_motors', instagram: 'samarqandmotors_uz', whatsapp: '+998712345678' },
      location: { lat: 41.3111, lng: 69.2797, address: 'Yunusobod tumani, 18-kvartal' },
    }),
    Store.create({
      seller: s3._id, name: 'Fergana Zapchast',
      description: 'Arzon narxlarda sifatli avtozapchastlar. Nexia, Matiz, Cobalt, Gentra modellari bo\'yicha ixtisoslashgan.',
      subscriptionPlan: 'BASIC', subscriptionExpiresAt: expires, isActive: true,
      contacts: { phone: '+998935556677', telegram: 'fergana_zapchast', instagram: 'fergana_zapchast', whatsapp: '+998935556677' },
      location: { lat: 41.2993, lng: 69.2401, address: 'Mustaqillik maydoni yaqini' },
    }),
    Store.create({
      seller: s4._id, name: 'Mirzo Ulugbek Auto',
      description: "Mirzo Ulugbek tumanidagi eng yirik zapchastlar do'koni. Original va analog qismlar mavjud.",
      subscriptionPlan: 'STANDARD', subscriptionExpiresAt: expires, isActive: true,
      contacts: { phone: '+998977778899', telegram: 'mirzo_auto', instagram: 'mirzo_ulugbek_auto', whatsapp: '+998977778899' },
      location: { lat: 41.3280, lng: 69.2950, address: "Mirzo Ulugbek tumani, Universitet ko'chasi" },
    }),
    Store.create({
      seller: s5._id, name: 'Chilonzor Zapchast',
      description: "Chilonzor tumanida arzon va original zapchastlar. Tez yetkazib berish xizmati mavjud.",
      subscriptionPlan: 'BASIC', subscriptionExpiresAt: expires, isActive: true,
      contacts: { phone: '+998881122334', telegram: 'chilonzor_zapchast', instagram: 'chilonzor_zapchast', whatsapp: '+998881122334' },
      location: { lat: 41.2748, lng: 69.2012, address: 'Chilonzor tumani, 9-mavze' },
    }),
  ]);

  console.log('Stores created');

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────
  const p = (store, seller, name, desc, price, category, img) => ({
    store, seller, name, description: desc, price, category,
    status: 'APPROVED',
    images: [`/uploads/products/${img}`],
  });

  const products = [
    // ── Toshkent Avtozapchast (Chorsu) ──────────────────────────
    p(st1._id, s1._id, 'Moy filtri (Nexia 3)',       'Original, Daewoo Nexia 3 uchun moy filtri',                35000,  'Filtrlar',          'oil_filter.jpg'),
    p(st1._id, s1._id, 'Havo filtri (Cobalt)',        'Chevrolet Cobalt uchun havo filtri, original',             45000,  'Filtrlar',          'air_filter.jpg'),
    p(st1._id, s1._id, 'Tormoz kolodkasi (Lacetti)',  "Lacetti old tormoz kolodkasi, 1 to'plam",                120000,  'Tormoz tizimi',     'brake_pads.jpg'),
    p(st1._id, s1._id, 'Akkumulator 60Ah',            'Varta Silver, 60Ah, barcha rusumlar uchun',               850000,  'Akkumulator',       'battery.jpg'),
    p(st1._id, s1._id, 'Moy (Castrol 5W-40, 4L)',    'Castrol Edge 5W-40, sintetika, 4 litr',                   280000,  'Moy va suyuqliklar','motor_oil.jpg'),
    p(st1._id, s1._id, 'Spark momiq sham (NGK)',      'NGK B6EB, 1 dona, universal',                              28000,  'Dvigatel',          'spark_plug.jpg'),

    // ── Samarqand Motors (Yunusobod) ────────────────────────────
    p(st2._id, s2._id, 'Suv nasosi (Matiz)',           'Daewoo Matiz uchun suv nasosi',                            95000,  'Sovutish tizimi',   'water_pump.jpg'),
    p(st2._id, s2._id, 'Gaz trosigi (Nexia)',          'Nexia 1/2 uchun gaz pedali trosigi',                       42000,  'Dvigatel',          'throttle_cable.jpg'),
    p(st2._id, s2._id, 'Amortizator (Damas, old)',     'Daewoo Damas old amortizatori, 1 dona',                   185000,  'Osma tizimi',       'shock_absorber.jpg'),
    p(st2._id, s2._id, 'Rulь nasos kammeri (Lacetti)', 'Lacetti gidroruль kammeri',                               320000,  'Rulь tizimi',       'power_steering_pump.jpg'),
    p(st2._id, s2._id, 'Termostat (Cobalt)',           'Chevrolet Cobalt termostat, 87°C',                         65000,  'Sovutish tizimi',   'thermostat.jpg'),
    p(st2._id, s2._id, 'Moy filtri (Cobalt)',          'Chevrolet Cobalt uchun moy filtri, original',              38000,  'Filtrlar',          'oil_filter.jpg'),

    // ── Fergana Zapchast (Markaz) ────────────────────────────────
    p(st3._id, s3._id, 'Tormoz disk (Gentra)',         'Chevrolet Gentra old tormoz diski',                       210000,  'Tormoz tizimi',     'brake_disc.jpg'),
    p(st3._id, s3._id, 'Shamol qayishi (Nexia 3)',     'Nexia 3 generator qayishi',                                55000,  'Dvigatel',          'v_belt.jpg'),
    p(st3._id, s3._id, 'Antigrez (1L, FELIX)',         'FELIX Carbox, qizil, -40°C, 1 litr',                       38000,  'Moy va suyuqliklar','antifreeze.jpg'),
    p(st3._id, s3._id, 'Tormoz suyuqligi DOT-4',       'LuKoil DOT-4, 0.5 litr',                                   22000,  'Moy va suyuqliklar','brake_fluid.jpg'),
    p(st3._id, s3._id, 'Tormoz kolodkasi (Gentra)',    'Chevrolet Gentra uchun tormoz kolodkasi',                  95000,  'Tormoz tizimi',     'brake_pads.jpg'),
    p(st3._id, s3._id, 'Akkumulator 55Ah',             'Tyumen Battery Standard 55Ah, arzon',                     620000,  'Akkumulator',       'battery.jpg'),

    // ── Mirzo Ulugbek Auto ───────────────────────────────────────
    p(st4._id, s4._id, 'Yag nasosi (Matiz)',           'Daewoo Matiz dvigatel yog nasosi',                         78000,  'Dvigatel',          'water_pump.jpg'),
    p(st4._id, s4._id, 'Havo filtri (Nexia 3)',        'Nexia 3 uchun havo filtri',                                32000,  'Filtrlar',          'air_filter.jpg'),
    p(st4._id, s4._id, 'Moy (Shell Helix 5W-30, 4L)', 'Shell Helix HX7 5W-30, yarim sintetik, 4L',               245000,  'Moy va suyuqliklar','motor_oil.jpg'),
    p(st4._id, s4._id, 'Amortizator (Cobalt, old)',    'Chevrolet Cobalt old amortizatori KYB',                   220000,  'Osma tizimi',       'shock_absorber.jpg'),
    p(st4._id, s4._id, 'Tormoz disk (Lacetti)',        'Lacetti old tormoz diski, ventilatsiyali',                175000,  'Tormoz tizimi',     'brake_disc.jpg'),
    p(st4._id, s4._id, 'Generator qayishi (Cobalt)',   'Cobalt poliklinli generator qayishi',                      48000,  'Dvigatel',          'v_belt.jpg'),
    p(st4._id, s4._id, 'Suv nasosi (Nexia 3)',         'Nexia 3 uchun suv nasosi, original',                      115000,  'Sovutish tizimi',   'water_pump.jpg'),

    // ── Chilonzor Zapchast ───────────────────────────────────────
    p(st5._id, s5._id, 'Moy filtri (Matiz)',           'Daewoo Matiz uchun moy filtri, arzon',                     18000,  'Filtrlar',          'oil_filter.jpg'),
    p(st5._id, s5._id, 'Havo filtri (Damas)',          'Daewoo Damas uchun havo filtri',                           22000,  'Filtrlar',          'air_filter.jpg'),
    p(st5._id, s5._id, 'Akkumulator 45Ah',             'Rocket 45Ah, Koreya, arzon va sifatli',                   480000,  'Akkumulator',       'battery.jpg'),
    p(st5._id, s5._id, 'Antigrez (FELIX, 5L)',         'FELIX Carbox 5 litr bochka, qizil',                       160000,  'Moy va suyuqliklar','antifreeze.jpg'),
    p(st5._id, s5._id, 'Tormoz suyuqligi DOT-4 (1L)', 'LuKoil DOT-4, 1 litr',                                     38000,  'Moy va suyuqliklar','brake_fluid.jpg'),
    p(st5._id, s5._id, 'Spark sham (Bosch)',           'Bosch Super Plus, 4 dona to\'plam',                        72000,  'Dvigatel',          'spark_plug.jpg'),
    p(st5._id, s5._id, 'Termostat (Nexia)',            'Daewoo Nexia uchun termostat, 82°C',                       42000,  'Sovutish tizimi',   'thermostat.jpg'),
    p(st5._id, s5._id, 'Rulь trosigi (Matiz)',         'Daewoo Matiz rulь trosigi',                                 55000,  'Rulь tizimi',       'throttle_cable.jpg'),
  ];

  await Product.insertMany(products);
  console.log(`Products created: ${products.length} ta`);

  console.log('\n=== SEED COMPLETED ===');
  console.log(`Jami: ${products.length} mahsulot, 5 do'kon, 7 foydalanuvchi`);
  console.log('');
  console.log('Admin:      admin@zzone.uz      / password123');
  console.log('Seller 1:   toshkent@zzone.uz   / password123  (Chorsu)');
  console.log('Seller 2:   samarqand@zzone.uz  / password123  (Yunusobod)');
  console.log('Seller 3:   fergana@zzone.uz     / password123  (Markaz)');
  console.log('Seller 4:   mirzo@zzone.uz       / password123  (Mirzo Ulugbek)');
  console.log('Seller 5:   chilonzor@zzone.uz   / password123  (Chilonzor)');
  console.log('Client:     jasur@zzone.uz       / password123');

  await mongoose.disconnect();
};

seed().catch((err) => { console.error(err); process.exit(1); });
