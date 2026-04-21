const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZZone API',
      version: '1.0.0',
      description: 'Avtozapchast marketplace REST API',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ─── Auth ───────────────────────────────────────────────
        RegisterBody: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', maxLength: 100, example: 'Jasur Xaridor' },
            email:    { type: 'string', format: 'email', example: 'jasur@zzone.uz' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            role:     { type: 'string', enum: ['SELLER', 'CLIENT'], default: 'CLIENT' },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'admin@zzone.uz' },
            password: { type: 'string', example: 'password123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id:         { type: 'string' },
                name:       { type: 'string' },
                email:      { type: 'string' },
                role:       { type: 'string', enum: ['ADMIN', 'SELLER', 'CLIENT'] },
                balance:    { type: 'number' },
                trialUsed:  { type: 'boolean' },
              },
            },
          },
        },
        // ─── User ───────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id:        { type: 'string' },
            name:       { type: 'string' },
            email:      { type: 'string' },
            role:       { type: 'string', enum: ['ADMIN', 'SELLER', 'CLIENT'] },
            balance:    { type: 'number' },
            trialUsed:  { type: 'boolean' },
            isBlocked:  { type: 'boolean' },
            createdAt:  { type: 'string', format: 'date-time' },
          },
        },
        // ─── Store ──────────────────────────────────────────────
        StoreLocation: {
          type: 'object',
          properties: {
            lat:     { type: 'number', example: 41.2856 },
            lng:     { type: 'number', example: 69.2294 },
            address: { type: 'string', example: 'Toshkent, Chorsu bozori yaqini' },
          },
        },
        Store: {
          type: 'object',
          properties: {
            _id:                    { type: 'string' },
            seller:                 { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' } } },
            name:                   { type: 'string' },
            description:            { type: 'string' },
            logo:                   { type: 'string', nullable: true },
            subscriptionPlan:       { type: 'string', enum: ['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM'], nullable: true },
            subscriptionExpiresAt:  { type: 'string', format: 'date-time', nullable: true },
            isActive:               { type: 'boolean' },
            location:               { $ref: '#/components/schemas/StoreLocation' },
            createdAt:              { type: 'string', format: 'date-time' },
          },
        },
        // ─── Product ────────────────────────────────────────────
        Product: {
          type: 'object',
          properties: {
            _id:             { type: 'string' },
            name:            { type: 'string' },
            description:     { type: 'string' },
            price:           { type: 'number' },
            category:        { type: 'string' },
            images:          { type: 'array', items: { type: 'string' } },
            status:          { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            rejectionReason: { type: 'string', nullable: true },
            store:           { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string' }, logo: { type: 'string' }, isActive: { type: 'boolean' } } },
            createdAt:       { type: 'string', format: 'date-time' },
          },
        },
        // ─── Pagination ─────────────────────────────────────────
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page:  { type: 'integer' },
            pages: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
        // ─── Error ──────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    paths: {
      // ══════════════════════════════════════════════════════════
      //  HEALTH
      // ══════════════════════════════════════════════════════════
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Server holati',
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' }, timestamp: { type: 'string' } } } } } },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  AUTH
      // ══════════════════════════════════════════════════════════
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: "Ro'yxatdan o'tish",
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } } },
          responses: {
            201: { description: 'Muvaffaqiyatli', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            400: { description: 'Validation xatosi', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            409: { description: 'Email band', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Kirish',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } } },
          responses: {
            200: { description: 'Muvaffaqiyatli', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            400: { description: 'Validation xatosi' },
            401: { description: "Noto'g'ri parol" },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Joriy foydalanuvchi',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
            401: { description: 'Token yo\'q yoki yaroqsiz' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  STORES (public)
      // ══════════════════════════════════════════════════════════
      '/api/stores': {
        get: {
          tags: ['Stores'],
          summary: "Barcha faol do'konlar (xarita uchun)",
          responses: {
            200: {
              description: 'OK',
              content: { 'application/json': { schema: { type: 'object', properties: { stores: { type: 'array', items: { $ref: '#/components/schemas/Store' } } } } } },
            },
          },
        },
      },
      '/api/stores/plans': {
        get: {
          tags: ['Stores'],
          summary: 'Obuna rejalari va narxlari',
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      plans: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name:         { type: 'string', enum: ['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM'] },
                            price:        { type: 'number' },
                            durationDays: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/stores/{id}': {
        get: {
          tags: ['Stores'],
          summary: "Do'kon ma'lumoti",
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Store MongoDB ID' }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { store: { $ref: '#/components/schemas/Store' } } } } } },
            404: { description: 'Topilmadi' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  STORES (seller)
      // ══════════════════════════════════════════════════════════
      '/api/stores/my': {
        get: {
          tags: ['Stores — Seller'],
          summary: "Mening do'konim",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { store: { $ref: '#/components/schemas/Store' } } } } } },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat SELLER)' },
          },
        },
      },
      '/api/stores/my/location': {
        put: {
          tags: ['Stores — Seller'],
          summary: "Do'kon joylashuvini yangilash",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    lat:     { type: 'number', example: 41.2856 },
                    lng:     { type: 'number', example: 69.2294 },
                    address: { type: 'string', example: 'Toshkent, Chorsu' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Yangilandi', content: { 'application/json': { schema: { type: 'object', properties: { store: { $ref: '#/components/schemas/Store' } } } } } },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat SELLER)' },
          },
        },
      },
      '/api/stores/subscription': {
        post: {
          tags: ['Stores — Seller'],
          summary: 'Obuna sotib olish',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['plan'],
                  properties: {
                    plan: { type: 'string', enum: ['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM'], example: 'BASIC' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Obuna faollashtirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      store:      { $ref: '#/components/schemas/Store' },
                      newBalance: { type: 'number' },
                    },
                  },
                },
              },
            },
            400: { description: 'TRIAL allaqachon ishlatilgan yoki balans yetarli emas' },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat SELLER)' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  PRODUCTS (public)
      // ══════════════════════════════════════════════════════════
      '/api/products': {
        get: {
          tags: ['Products'],
          summary: 'Mahsulotlar ro\'yhati (public)',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Kategoriya filtri' },
            { name: 'minPrice', in: 'query', schema: { type: 'number' }, description: 'Min narx' },
            { name: 'maxPrice', in: 'query', schema: { type: 'number' }, description: 'Max narx' },
            { name: 'page',     in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit',    in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'sort',     in: 'query', schema: { type: 'string', default: '-createdAt' }, description: 'Saralash (masalan: price, -price, -createdAt)' },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      products:   { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Mahsulot ma\'lumoti (public)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { product: { $ref: '#/components/schemas/Product' } } } } } },
            404: { description: 'Topilmadi' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  PRODUCTS (seller)
      // ══════════════════════════════════════════════════════════
      '/api/products/my': {
        get: {
          tags: ['Products — Seller'],
          summary: 'Mening mahsulotlarim',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] } },
            { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { products: { type: 'array', items: { $ref: '#/components/schemas/Product' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat SELLER)' },
          },
        },
        post: {
          tags: ['Products — Seller'],
          summary: 'Yangi mahsulot qo\'shish',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['name', 'price', 'category'],
                  properties: {
                    name:        { type: 'string', maxLength: 200, example: 'Moy filtri' },
                    price:       { type: 'number', minimum: 0, example: 35000 },
                    category:    { type: 'string', example: 'Filtrlar' },
                    description: { type: 'string', maxLength: 2000 },
                    images:      { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Max 10 ta rasm (jpg/png/webp, max 5MB)' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Yaratildi', content: { 'application/json': { schema: { type: 'object', properties: { product: { $ref: '#/components/schemas/Product' } } } } } },
            400: { description: 'Validation xatosi' },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat SELLER)' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  ADMIN — Stats
      // ══════════════════════════════════════════════════════════
      '/api/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Dashboard statistikasi',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users:    { type: 'object', properties: { total: { type: 'integer' }, sellers: { type: 'integer' } } },
                      stores:   { type: 'object', properties: { total: { type: 'integer' }, active: { type: 'integer' } } },
                      products: { type: 'object', properties: { total: { type: 'integer' }, pending: { type: 'integer' }, approved: { type: 'integer' } } },
                    },
                  },
                },
              },
            },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  ADMIN — Products
      // ══════════════════════════════════════════════════════════
      '/api/admin/products/pending': {
        get: {
          tags: ['Admin — Products'],
          summary: 'Kutilayotgan mahsulotlar',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { products: { type: 'array', items: { $ref: '#/components/schemas/Product' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
          },
        },
      },
      '/api/admin/products': {
        get: {
          tags: ['Admin — Products'],
          summary: 'Barcha mahsulotlar (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] } },
            { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { products: { type: 'array', items: { $ref: '#/components/schemas/Product' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
          },
        },
      },
      '/api/admin/products/{id}/approve': {
        patch: {
          tags: ['Admin — Products'],
          summary: 'Mahsulotni tasdiqlash',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Tasdiqlandi', content: { 'application/json': { schema: { type: 'object', properties: { product: { $ref: '#/components/schemas/Product' } } } } } },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
            404: { description: 'Topilmadi' },
          },
        },
      },
      '/api/admin/products/{id}/reject': {
        patch: {
          tags: ['Admin — Products'],
          summary: 'Mahsulotni rad etish',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['reason'],
                  properties: { reason: { type: 'string', example: 'Rasm sifatsiz' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Rad etildi', content: { 'application/json': { schema: { type: 'object', properties: { product: { $ref: '#/components/schemas/Product' } } } } } },
            400: { description: 'reason maydoni kiritilmagan' },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
            404: { description: 'Topilmadi' },
          },
        },
      },
      '/api/admin/products/{id}': {
        delete: {
          tags: ['Admin — Products'],
          summary: 'Mahsulotni o\'chirish',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'O\'chirildi' },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
            404: { description: 'Topilmadi' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  ADMIN — Stores
      // ══════════════════════════════════════════════════════════
      '/api/admin/stores': {
        get: {
          tags: ['Admin — Stores'],
          summary: "Barcha do'konlar (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'true — faol, false — nofaol' },
            { name: 'page',     in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit',    in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { stores: { type: 'array', items: { $ref: '#/components/schemas/Store' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
          },
        },
        post: {
          tags: ['Admin — Stores'],
          summary: "Sotuvchi + do'kon yaratish",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['sellerName', 'sellerEmail', 'sellerPassword', 'name'],
                  properties: {
                    sellerName:     { type: 'string', example: 'Yangi Sotuvchi' },
                    sellerEmail:    { type: 'string', format: 'email', example: 'yangi@zzone.uz' },
                    sellerPassword: { type: 'string', minLength: 6, example: 'password123' },
                    name:           { type: 'string', example: 'Yangi Do\'kon' },
                    description:    { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Yaratildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      seller: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' } } },
                      store:  { $ref: '#/components/schemas/Store' },
                    },
                  },
                },
              },
            },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
            409: { description: 'Email band' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  ADMIN — Users
      // ══════════════════════════════════════════════════════════
      '/api/admin/users': {
        get: {
          tags: ['Admin — Users'],
          summary: 'Barcha foydalanuvchilar',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'role',  in: 'query', schema: { type: 'string', enum: ['ADMIN', 'SELLER', 'CLIENT'] } },
            { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { users: { type: 'array', items: { $ref: '#/components/schemas/User' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
          },
        },
      },
      '/api/admin/users/{id}/block': {
        patch: {
          tags: ['Admin — Users'],
          summary: 'Foydalanuvchini bloklash / blokdan chiqarish',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Holat o\'zgartirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { type: 'object', properties: { _id: { type: 'string' }, isBlocked: { type: 'boolean' } } },
                    },
                  },
                },
              },
            },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
            404: { description: 'Topilmadi' },
          },
        },
      },
      '/api/admin/users/{id}/balance': {
        patch: {
          tags: ['Admin — Users'],
          summary: 'Balans o\'zgartirish',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount'],
                  properties: {
                    amount: { type: 'number', example: 500000, description: 'Musbat — qo\'shish, manfiy — ayirish' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Yangilandi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      userId:     { type: 'string' },
                      newBalance: { type: 'number' },
                    },
                  },
                },
              },
            },
            401: { description: 'Autentifikatsiya xatosi' },
            403: { description: 'Ruxsat yo\'q (faqat ADMIN)' },
            404: { description: 'Topilmadi' },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
