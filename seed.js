require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./src/models/User');
const Store    = require('./src/models/Store');
const Product  = require('./src/models/Product');

// Real Unsplash CDN images — specific auto parts photos
const IMGS = {
  oilFilter:   'https://images.unsplash.com/photo-1642075223291-f9ec545889fa?w=400&h=300&fit=crop&auto=format&q=80',
  airFilter:   'https://images.unsplash.com/photo-1710130168142-d2ec07ed8434?w=400&h=300&fit=crop&auto=format&q=80',
  brakePads:   'https://images.unsplash.com/photo-1696494561430-de087dd0bd69?w=400&h=300&fit=crop&auto=format&q=80',
  brakeDisc:   'https://images.unsplash.com/photo-1588017530244-c57df911f73b?w=400&h=300&fit=crop&auto=format&q=80',
  battery:     'https://images.unsplash.com/photo-1597766325363-f5576d851d6a?w=400&h=300&fit=crop&auto=format&q=80',
  motorOil:    'https://images.unsplash.com/photo-1590227763209-821c686b932f?w=400&h=300&fit=crop&auto=format&q=80',
  sparkPlug:   'https://images.unsplash.com/photo-1670764169470-bd2f737f9248?w=400&h=300&fit=crop&auto=format&q=80',
  waterPump:   'https://images.unsplash.com/photo-1716237920356-42aa302acdd0?w=400&h=300&fit=crop&auto=format&q=80',
  shock:       'https://images.unsplash.com/photo-1701836924325-3bdbfc2e8689?w=400&h=300&fit=crop&auto=format&q=80',
  coolant:     'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400&h=300&fit=crop&auto=format&q=80',
  belt:        'https://images.unsplash.com/photo-1767739791250-f972ca75c60e?w=400&h=300&fit=crop&auto=format&q=80',
  thermostat:  'https://images.unsplash.com/photo-1748170557381-7a1fc4c3ba45?w=400&h=300&fit=crop&auto=format&q=80',
  steering:    'https://images.unsplash.com/photo-1716972898948-21551a332165?w=400&h=300&fit=crop&auto=format&q=80',
  engine:      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop&auto=format&q=80',
  brakeFluid:  'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&h=300&fit=crop&auto=format&q=80',
};

const mk = (store, seller, name, desc, price, category, imgKey) => ({
  store, seller, name, description: desc, price, category,
  status: 'APPROVED',
  images: [IMGS[imgKey] || IMGS.engine],
});

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
  const products = [
    // ── Toshkent Avtozapchast ──────────────────────────────────────
    mk(st1._id, s1._id, 'Moy filtri (Nexia 3)',      'Original Daewoo Nexia 3 uchun moy filtri. Yuqori sifatli filtrlash, dvigatelni yog' + "'" + 'dan himoya qiladi.',           35000,  'Filtrlar',           'oilFilter'),
    mk(st1._id, s1._id, 'Havo filtri (Cobalt)',      'Chevrolet Cobalt uchun havo filtri, original. Dvigatelga kiruvchi changni to' + "'" + 'liq ushlab qoladi.',                 45000,  'Filtrlar',           'airFilter'),
    mk(st1._id, s1._id, 'Tormoz kolodkasi (Lacetti)','Lacetti old tormoz kolodkasi to' + "'" + 'plami. Kafolat beriladi. Uzoq xizmat muddati.',                                 120000,  'Tormoz tizimi',      'brakePads'),
    mk(st1._id, s1._id, 'Akkumulator 60Ah',          'Varta Silver 60Ah. Barcha avtomobil rusumlariga mos. Sovuqda ishonchli yoqilish.',                                         850000,  'Akkumulator',        'battery'),
    mk(st1._id, s1._id, 'Castrol Edge 5W-40 4L',    'Castrol Edge 5W-40 to' + "'" + 'liq sintetika, 4 litr. Yuqori haroratda dvigatelni himoya qiladi.',                        280000,  'Moy va suyuqliklar', 'motorOil'),
    mk(st1._id, s1._id, 'NGK Momiq Sham B6EB',      'NGK B6EB, 1 dona. Ko' + "'" + 'p modellarga mos, ishonchli alanga, tejamkor benzin sarfi.',                                28000,  'Dvigatel',           'sparkPlug'),

    // ── Samarqand Motors ───────────────────────────────────────────
    mk(st2._id, s2._id, 'Suv nasosi (Matiz)',        'Daewoo Matiz uchun suv nasosi. Original. Sovutish tizimini to' + "'" + 'g' + "'" + 'ri ishlashini ta' + "'" + 'minlaydi.',  95000,  'Sovutish tizimi',    'waterPump'),
    mk(st2._id, s2._id, 'Gaz trosigi (Nexia)',       'Nexia 1/2 uchun gaz pedali trosigi. Yumshoq harakat, ishonchli xizmat muddati.',                                            42000,  'Dvigatel',           'engine'),
    mk(st2._id, s2._id, 'Amortizator (Damas old)',   'Daewoo Damas old amortizatori, KYB ishlab chiqarishi. Sifatli va chidamli.',                                               185000,  'Osma tizimi',        'shock'),
    mk(st2._id, s2._id, 'Gidroruhl kammeri Lacetti','Lacetti gidroruhl kammeri. Original sifat, kafolat beriladi.',                                                              320000,  'Rulь tizimi',        'steering'),
    mk(st2._id, s2._id, 'Termostat (Cobalt) 87°C',  'Chevrolet Cobalt termostat, 87°C. Sovutish tizimini to' + "'" + 'g' + "'" + 'ri haroratda boshqaradi.',                     65000,  'Sovutish tizimi',    'thermostat'),
    mk(st2._id, s2._id, 'Moy filtri (Cobalt)',       'Chevrolet Cobalt uchun original moy filtri. Uzoq xizmat muddati, yuqori filtrlash sifati.',                                  38000,  'Filtrlar',           'oilFilter'),

    // ── Fergana Zapchast ───────────────────────────────────────────
    mk(st3._id, s3._id, 'Tormoz disk (Gentra)',      'Chevrolet Gentra old tormoz diski. Sifatli po' + "'" + 'lat, ventilyatsiyali.',                                            210000,  'Tormoz tizimi',      'brakeDisc'),
    mk(st3._id, s3._id, 'Generator qayishi (Nexia 3)','Nexia 3 generator qayishi. Chidamli rezina, uzoq xizmat muddati.',                                                         55000,  'Dvigatel',           'belt'),
    mk(st3._id, s3._id, 'Antigrez FELIX 1L (qizil)', 'FELIX Carbox, qizil, −40°C gacha. 1 litr. Sovutish tizimini zamonaviy himoya.',                                             38000,  'Moy va suyuqliklar', 'coolant'),
    mk(st3._id, s3._id, 'Tormoz suyuqligi DOT-4',   'LuKoil DOT-4, 0.5 litr. Barcha tormoz tizimlari uchun. Yuqori qaynash nuqtasi.',                                            22000,  'Moy va suyuqliklar', 'brakeFluid'),
    mk(st3._id, s3._id, 'Tormoz kolodkasi (Gentra)', 'Chevrolet Gentra uchun tormoz kolodkasi to' + "'" + 'plami. Uzoq xizmat, past chang.',                                      95000,  'Tormoz tizimi',      'brakePads'),
    mk(st3._id, s3._id, 'Akkumulator 55Ah',          'Tyumen Battery Standard 55Ah. Arzon va sifatli. 2 yil kafolat.',                                                            620000,  'Akkumulator',        'battery'),

    // ── Mirzo Ulugbek Auto ─────────────────────────────────────────
    mk(st4._id, s4._id, 'Yog nasosi (Matiz)',        'Daewoo Matiz dvigatel yog nasosi. Original. Dvigatel yog bosimini ta' + "'" + 'minlaydi.',                                  78000,  'Dvigatel',           'engine'),
    mk(st4._id, s4._id, 'Havo filtri (Nexia 3)',     'Nexia 3 uchun havo filtri. Changdan to' + "'" + 'liq himoya, dvigatel samaradorligini oshiradi.',                            32000,  'Filtrlar',           'airFilter'),
    mk(st4._id, s4._id, 'Shell Helix HX7 5W-30 4L', 'Shell Helix HX7 5W-30, yarim sintetik, 4 litr. Kundalik haydash uchun optimal tanlov.',                                     245000,  'Moy va suyuqliklar', 'motorOil'),
    mk(st4._id, s4._id, 'Amortizator Cobalt (old)',  'Chevrolet Cobalt old amortizatori KYB. Professional sifat, tekis haydash.',                                                 220000,  'Osma tizimi',        'shock'),
    mk(st4._id, s4._id, 'Tormoz disk (Lacetti)',     'Lacetti old tormoz diski, ventilyatsiyali. Ishonchli tormozlash.',                                                          175000,  'Tormoz tizimi',      'brakeDisc'),
    mk(st4._id, s4._id, 'Poliklinli qayish (Cobalt)','Cobalt poliklinli generator qayishi. Uzoq xizmat, kam shovqin.',                                                             48000,  'Dvigatel',           'belt'),
    mk(st4._id, s4._id, 'Suv nasosi (Nexia 3)',      'Nexia 3 uchun suv nasosi, original. Kuchli aylanma, uzoq xizmat.',                                                          115000,  'Sovutish tizimi',    'waterPump'),

    // ── Chilonzor Zapchast ─────────────────────────────────────────
    mk(st5._id, s5._id, 'Moy filtri (Matiz)',        'Daewoo Matiz uchun moy filtri. Arzon narxda sifatli filtrlash.',                                                             18000,  'Filtrlar',           'oilFilter'),
    mk(st5._id, s5._id, 'Havo filtri (Damas)',       'Daewoo Damas uchun havo filtri. Tozalik kafolati, oson o' + "'" + 'rnatish.',                                               22000,  'Filtrlar',           'airFilter'),
    mk(st5._id, s5._id, 'Akkumulator 45Ah',          'Rocket 45Ah, Koreya ishlab chiqarishi. Arzon va sifatli, 18 oy kafolat.',                                                   480000,  'Akkumulator',        'battery'),
    mk(st5._id, s5._id, 'Antigrez FELIX 5L (qizil)', 'FELIX Carbox 5 litr bochka. Ulgurji narxda, qizil rang, −40°C.',                                                            160000,  'Moy va suyuqliklar', 'coolant'),
    mk(st5._id, s5._id, 'Tormoz suyuqligi DOT-4 1L', 'LuKoil DOT-4, 1 litr. To' + "'" + 'liq hajm, yuqori qaynash nuqtasi.',                                                     38000,  'Moy va suyuqliklar', 'brakeFluid'),
    mk(st5._id, s5._id, 'Bosch Spark Plus (4 dona)', 'Bosch Super Plus, 4 dona to' + "'" + 'plam. Ishonchli alanga, tejamkor sarfi.',                                              72000,  'Dvigatel',           'sparkPlug'),
    mk(st5._id, s5._id, 'Termostat (Nexia) 82°C',   'Daewoo Nexia uchun termostat, 82°C. Asl original, sovutish tizimini to' + "'" + 'g' + "'" + 'ri saqlaydi.',                 42000,  'Sovutish tizimi',    'thermostat'),
    mk(st5._id, s5._id, 'Rulь trosigi (Matiz)',      'Daewoo Matiz rulь trosigi. Yumshoq boshqaruv, uzoq xizmat.',                                                                 55000,  'Rulь tizimi',        'steering'),
  ];

  await Product.insertMany(products);
  console.log(`Products created: ${products.length} ta`);

  console.log('\n=== SEED COMPLETED ===');
  console.log(`Jami: ${products.length} mahsulot, 5 do'kon, 7 foydalanuvchi`);
  console.log('');
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
