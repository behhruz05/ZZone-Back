# ZZone Backend — Loyiha Hujjati

## Texnologiyalar
- **Runtime:** Node.js + Express.js
- **DB:** MongoDB (Mongoose)
- **Auth:** JWT (jsonwebtoken)
- **Upload:** Multer (local disk)
- **Security:** Helmet, bcryptjs
- **Cron:** node-cron

---

## Ishga tushirish

```bash
npm run dev     # nodemon bilan (port 3000)
npm start       # oddiy node
```

> **Eslatma:** macOS da port 5000 — Control Center (AirPlay) tomonidan band qilinadi. `.env` da `PORT=3000` ishlatiladi.

---

## Muhit o'zgaruvchilari (`.env`)

```
PORT=3000
NODE_ENV=development
MONGODB_URI=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
BASE_URL=http://localhost:3000
```

---

## API Endpointlar

### Auth — `/api/auth`
| Method | URL | Kirish | Tavsif |
|--------|-----|--------|--------|
| POST | `/register` | Ochiq | Ro'yxatdan o'tish (role: CLIENT yoki SELLER) |
| POST | `/login` | Ochiq | Kirish, JWT qaytaradi |
| GET | `/me` | JWT | O'z profilini ko'rish |

### Mahsulotlar — `/api/products`
| Method | URL | Kirish | Tavsif |
|--------|-----|--------|--------|
| GET | `/` | Ochiq | Barcha tasdiqlangan mahsulotlar (filter: category, minPrice, maxPrice, page, sort) |
| GET | `/my` | SELLER | O'z mahsulotlarini ko'rish |
| POST | `/` | SELLER | Mahsulot qo'shish (to'g'ridan-to'g'ri APPROVED holda chiqadi) |
| GET | `/:id` | Ochiq | Bitta mahsulot |

### Do'konlar — `/api/stores`
| Method | URL | Kirish | Tavsif |
|--------|-----|--------|--------|
| GET | `/plans` | Ochiq | Obuna rejalari va narxlari |
| GET | `/my` | SELLER | O'z do'konini ko'rish |
| POST | `/subscription` | SELLER | Obuna rejasini faollashtirish |
| GET | `/:id` | Ochiq | Do'kon sahifasi |

### Admin — `/api/admin` *(barcha so'rovlar ADMIN roli talab qiladi)*
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | `/stats` | Dashboard statistikasi |
| POST | `/stores` | Seller uchun do'kon yaratish |
| GET | `/stores` | Barcha do'konlar ro'yxati |
| GET | `/products/pending` | Admin tasdig'ini kutayotgan mahsulotlar |
| PATCH | `/products/:id/approve` | Mahsulotni tasdiqlash |
| PATCH | `/products/:id/reject` | Mahsulotni rad etish (reason talab) |
| PATCH | `/users/:id/balance` | Seller balansini to'ldirish |

---

## Biznes Logika

### Do'kon yaratish
- **Seller o'zi do'kon yarata olmaydi**
- Faqat **admin** seller uchun do'kon ochib beradi: `POST /api/admin/stores`
- Body: `{ sellerId, name, description? }`
- Do'kon **darhol faol** (`isActive: true`) holda yaratiladi — obunasiz, 0 so'm bilan

### Mahsulot qo'shish
- Seller do'koniga mahsulot qo'shadi: `POST /api/products`
- Mahsulot **admin tekshiruvisiz darhol APPROVED** holda chiqadi
- Websaytda hech qanday kutishsiz ko'rinadi

### Obuna (ixtiyoriy)
| Reja | Narx | Muddat |
|------|------|--------|
| TRIAL | 0 so'm | 30 kun (bir marta) |
| BASIC | 100,000 so'm | 30 kun |
| STANDARD | 300,000 so'm | 30 kun |
| PREMIUM | 500,000 so'm | 30 kun |

- Seller balansini admin to'ldiradi
- Obuna tugaganda cron (har kuni 00:00) do'konni `isActive: false` qiladi

### Foydalanuvchi rollari
| Rol | Huquqlar |
|-----|----------|
| CLIENT | Mahsulotlarni ko'rish |
| SELLER | Do'konni boshqarish, mahsulot qo'shish |
| ADMIN | Do'kon yaratish, mahsulot moderatsiya, balans boshqarish |

---

## Fayl Strukturasi

```
Backend/
├── server.js               # Kirish nuqtasi
├── app.js                  # Express sozlamalari
├── src/
│   ├── config/db.js        # MongoDB ulanish
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── store.controller.js
│   │   ├── product.controller.js
│   │   └── admin.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── store.routes.js
│   │   ├── product.routes.js
│   │   └── admin.routes.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Store.js
│   │   └── Product.js
│   ├── middleware/
│   │   ├── auth.js         # JWT tekshirish
│   │   ├── role.js         # Rol tekshirish
│   │   ├── upload.js       # Multer (rasm yuklash)
│   │   ├── validate.js     # express-validator
│   │   └── errorHandler.js
│   ├── services/
│   │   └── subscription.service.js
│   ├── jobs/
│   │   └── subscription.cron.js  # Kunlik 00:00 da eskirgan obunalarni o'chiradi
│   └── utils/
│       ├── ApiError.js
│       ├── ApiResponse.js
│       └── constants.js    # SUBSCRIPTION_PLANS
└── uploads/
    ├── logos/              # Do'kon logolari
    └── products/           # Mahsulot rasmlari
```

---

## O'zgartirishlar Tarixi

### v1.1 — Logika to'g'rilanishi
- **Seller do'kon yarata olmaydi** — faqat admin `POST /api/admin/stores` orqali yaratadi
- **Do'kon default faol** — admin yaratganda `isActive: true`, 0 so'm, obunasiz
- **Mahsulot darhol chiqadi** — `status: 'APPROVED'` by default, admin tekshiruvi yo'q
- **Port 5000 → 3000** — macOS Control Center port 5000 ni band qilganligi sababli
