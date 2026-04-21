require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./src/models/User');
const Store    = require('./src/models/Store');
const Product  = require('./src/models/Product');

// Picsum Photos — free permanent CDN, deterministic by seed name
const img = (seed, w = 400, h = 300) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

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
    User.create({ name: 'Toshkent Avtozapchast', email: 'toshkent@zzone.uz',  password: 'password123', role: 'SELLER', balance: 500000 }),
    User.create({ name: 'Samarqand Motors',       email: 'samarqand@zzone.uz', password: 'password123', role: 'SELLER', balance: 300000 }),
    User.create({ name: 'Fergana Zapchast',       email: 'fergana@zzone.uz',   password: 'password123', role: 'SELLER', balance: 100000 }),
    User.create({ name: 'Mirzo Ulugbek Auto',     email: 'mirzo@zzone.uz',     password: 'password123', role: 'SELLER', balance: 250000 }),
    User.create({ name: 'Chilonzor Zapchast',     email: 'chilonzor@zzone.uz', password: 'password123', role: 'SELLER', balance: 180000 }),
  ]);

  await Promise.all([
    User.create({ name: 'Jasur Xaridor',   email: 'jasur@zzone.uz',   password: 'password123', role: 'CLIENT' }),
    User.create({ name: 'Sherzod Xaridor', email: 'sherzod@zzone.uz', password: 'password123', role: 'CLIENT' }),
  ]);

  console.log('Users created');

  // ─── STORES ───────────────────────────────────────────────────────────────
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [st1, st2, st3, st4, st5] = await Promise.all([
    Store.create({
      seller: s1._id, name: 'Toshkent Avtozapchast',
      description: 'Barcha rusumli avtomobillar uchun original va analog ehtiyot qismlar. 10 yildan ortiq tajriba, kafolat bilan ishlaymiz.',
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
      description: "Arzon narxlarda sifatli avtozapchastlar. Nexia, Matiz, Cobalt, Gentra uchun ixtisoslashgan.",
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
  // Real picsum.photos CDN URLs — permanent, no auth needed
  const mk = (store, seller, name, desc, price, category, imgSeed) => ({
    store, seller, name, description: desc, price, category,
    status: 'APPROVED',
    images: [img(imgSeed)],
  });

  const products = [
    // ── Toshkent Avtozapchast ──────────────────────────────────────
    mk(st1._id, s1._id, 'Moy filtri (Nexia 3)',      'Original, Daewoo Nexia 3 uchun moy filtri. Yuqori sifatli filtrlash.',            35000,  'Filtrlar',           'oil-filter-01'),
    mk(st1._id, s1._id, 'Havo filtri (Cobalt)',       'Chevrolet Cobalt uchun havo filtri, original. Dvigatelni tozalaydi.',             45000,  'Filtrlar',           'air-filter-02'),
    mk(st1._id, s1._id, 'Tormoz kolodkasi (Lacetti)', "Lacetti old tormoz kolodkasi, 1 to'plam. Kafolat bilan.",                       120000,  'Tormoz tizimi',      'brake-pads-03'),
    mk(st1._id, s1._id, 'Akkumulator 60Ah',           'Varta Silver, 60Ah. Barcha rusumlar uchun mos. Ishonchli ishlab berish.',        850000,  'Akkumulator',        'battery-04'),
    mk(st1._id, s1._id, 'Moy Castrol 5W-40 4L',       'Castrol Edge 5W-40 sintetika, 4 litr. Yuqori haroratda ishonchli himoya.',      280000,  'Moy va suyuqliklar', 'motor-oil-05'),
    mk(st1._id, s1._id, 'NGK Momiq Sham',             'NGK B6EB, 1 dona. Universalyachki, ko\'p modellarga mos.',                      28000,  'Dvigatel',           'spark-plug-06'),

    // ── Samarqand Motors ───────────────────────────────────────────
    mk(st2._id, s2._id, 'Suv nasosi (Matiz)',          'Daewoo Matiz uchun suv nasosi. Original zapas qism.',                           95000,  'Sovutish tizimi',    'water-pump-07'),
    mk(st2._id, s2._id, 'Gaz trosigi (Nexia)',         'Nexia 1/2 uchun gaz pedali trosigi. Yumshoq harakat, uzoq xizmat.',             42000,  'Dvigatel',           'cable-08'),
    mk(st2._id, s2._id, 'Amortizator Damas (old)',     'Daewoo Damas old amortizatori, 1 dona. KYB ishlab chiqarishi.',                185000,  'Osma tizimi',        'shock-09'),
    mk(st2._id, s2._id, 'Gidroruhl kammeri Lacetti',  'Lacetti gidroruhl kammeri. Original sifat, kafolat bilan.',                    320000,  'Rulь tizimi',        'pump-10'),
    mk(st2._id, s2._id, 'Termostat (Cobalt)',          'Chevrolet Cobalt termostat, 87°C. Sovutish tizimini boshqaradi.',               65000,  'Sovutish tizimi',    'thermostat-11'),
    mk(st2._id, s2._id, 'Moy filtri (Cobalt)',         'Chevrolet Cobalt uchun moy filtri. Original, uzoq xizmat.',                    38000,  'Filtrlar',           'oil-filter-12'),

    // ── Fergana Zapchast ───────────────────────────────────────────
    mk(st3._id, s3._id, 'Tormoz disk (Gentra)',        'Chevrolet Gentra old tormoz diski. Sifatli po\'lat.',                          210000,  'Tormoz tizimi',      'disc-13'),
    mk(st3._id, s3._id, 'Generator qayishi (Nexia 3)', 'Nexia 3 generator qayishi. Chidamli rezina.',                                  55000,  'Dvigatel',           'belt-14'),
    mk(st3._id, s3._id, 'Antigrez FELIX 1L',           'FELIX Carbox, qizil, -40°C gacha. 1 litr.',                                    38000,  'Moy va suyuqliklar', 'coolant-15'),
    mk(st3._id, s3._id, 'Tormoz suyuqligi DOT-4',      'LuKoil DOT-4, 0.5 litr. Barcha tormoz tizimlari uchun.',                      22000,  'Moy va suyuqliklar', 'brake-fluid-16'),
    mk(st3._id, s3._id, 'Tormoz kolodkasi (Gentra)',   'Chevrolet Gentra uchun tormoz kolodkasi. Uzoq xizmat.',                        95000,  'Tormoz tizimi',      'brake-pads-17'),
    mk(st3._id, s3._id, 'Akkumulator 55Ah',            'Tyumen Battery Standard 55Ah. Arzon va sifatli.',                             620000,  'Akkumulator',        'battery-18'),

    // ── Mirzo Ulugbek Auto ─────────────────────────────────────────
    mk(st4._id, s4._id, 'Yog nasosi (Matiz)',           'Daewoo Matiz dvigatel yog nasosi. Original.',                                  78000,  'Dvigatel',           'pump-19'),
    mk(st4._id, s4._id, 'Havo filtri (Nexia 3)',        'Nexia 3 uchun havo filtri. Changdan himoya.',                                  32000,  'Filtrlar',           'air-filter-20'),
    mk(st4._id, s4._id, 'Shell Helix 5W-30 4L',        'Shell Helix HX7 5W-30, yarim sintetik, 4L.',                                 245000,  'Moy va suyuqliklar', 'oil-21'),
    mk(st4._id, s4._id, 'Amortizator Cobalt (old)',     'Chevrolet Cobalt old amortizatori KYB. Professional sifat.',                 220000,  'Osma tizimi',        'shock-22'),
    mk(st4._id, s4._id, 'Tormoz disk (Lacetti)',        'Lacetti old tormoz diski, ventilatsiyali. Ishonchli tormoz.',                175000,  'Tormoz tizimi',      'disc-23'),
    mk(st4._id, s4._id, 'Qayish (Cobalt)',              'Cobalt poliklinli generator qayishi. Uzoq xizmat.',                           48000,  'Dvigatel',           'belt-24'),
    mk(st4._id, s4._id, 'Suv nasosi (Nexia 3)',         'Nexia 3 uchun suv nasosi, original. Kuchli aylanma.',                        115000,  'Sovutish tizimi',    'water-pump-25'),

    // ── Chilonzor Zapchast ─────────────────────────────────────────
    mk(st5._id, s5._id, 'Moy filtri (Matiz)',           'Daewoo Matiz uchun moy filtri. Arzon, sifatli.',                              18000,  'Filtrlar',           'oil-filter-26'),
    mk(st5._id, s5._id, 'Havo filtri (Damas)',          'Daewoo Damas uchun havo filtri. Tozalik kafolati.',                           22000,  'Filtrlar',           'air-filter-27'),
    mk(st5._id, s5._id, 'Akkumulator 45Ah',             'Rocket 45Ah, Koreya ishlab chiqarishi. Arzon va sifatli.',                   480000,  'Akkumulator',        'battery-28'),
    mk(st5._id, s5._id, 'Antigrez FELIX 5L',            'FELIX Carbox 5 litr bochka, qizil. Ulgurji narxda.',                         160000,  'Moy va suyuqliklar', 'coolant-29'),
    mk(st5._id, s5._id, 'Tormoz suyuqligi DOT-4 1L',   'LuKoil DOT-4, 1 litr. To\'liq hajm.',                                        38000,  'Moy va suyuqliklar', 'brake-fluid-30'),
    mk(st5._id, s5._id, 'Bosch Spark Sham (4 dona)',    "Bosch Super Plus, 4 dona to'plam. Ishonchli alanga.",                         72000,  'Dvigatel',           'spark-31'),
    mk(st5._id, s5._id, 'Termostat (Nexia)',            'Daewoo Nexia uchun termostat, 82°C. Asl original.',                           42000,  'Sovutish tizimi',    'thermostat-32'),
    mk(st5._id, s5._id, 'Rulь trosigi (Matiz)',         'Daewoo Matiz rulь trosigi. Yumshoq boshqaruv.',                               55000,  'Rulь tizimi',        'cable-33'),
  ];

  await Product.insertMany(products);
  console.log(`Products created: ${products.length} ta`);

  console.log('\n=== SEED COMPLETED ===');
  console.log(`Jami: ${products.length} mahsulot, 5 do'kon, 7 foydalanuvchi\n`);
  console.log('Admin:      admin@zzone.uz      / password123');
  console.log('Seller 1:   toshkent@zzone.uz   / password123');
  console.log('Seller 2:   samarqand@zzone.uz  / password123');
  console.log('Seller 3:   fergana@zzone.uz     / password123');
  console.log('Seller 4:   mirzo@zzone.uz       / password123');
  console.log('Seller 5:   chilonzor@zzone.uz   / password123');
  console.log('Client:     jasur@zzone.uz       / password123');

  await mongoose.disconnect();
};

seed().catch((err) => { console.error(err); process.exit(1); });
