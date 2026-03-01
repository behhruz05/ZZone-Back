#!/bin/bash
BASE="http://localhost:5000/api"

echo "=============================="
echo "  AVTOHUB API TEST"
echo "=============================="

# ─── LOGIN ────────────────────────────────────────────────────────────────────
echo -e "\n[1] LOGIN — ADMIN"
ADMIN_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"behruz.admin@avtohub.uz","password":"admin123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${ADMIN_TOKEN:0:40}..."

echo -e "\n[2] LOGIN — SELLER"
SELLER_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alisher@avtohub.uz","password":"seller123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${SELLER_TOKEN:0:40}..."

echo -e "\n[3] LOGIN — CLIENT"
CLIENT_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jasur@avtohub.uz","password":"client123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${CLIENT_TOKEN:0:40}..."

# ─── GET ME ───────────────────────────────────────────────────────────────────
echo -e "\n[4] GET /auth/me — ADMIN"
curl -s $BASE/auth/me -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n\n[5] GET /auth/me — SELLER"
curl -s $BASE/auth/me -H "Authorization: Bearer $SELLER_TOKEN"

# ─── CREATE STORE ─────────────────────────────────────────────────────────────
echo -e "\n\n[6] CREATE STORE — SELLER"
STORE_RESP=$(curl -s -X POST $BASE/stores \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -F "name=AutoParts Pro" \
  -F "description=Barcha turdagi avtozapchastlar - original va analoglar")
echo $STORE_RESP
STORE_ID=$(echo $STORE_RESP | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Store ID: $STORE_ID"

# ─── ACTIVATE SUBSCRIPTION ───────────────────────────────────────────────────
echo -e "\n[7] ACTIVATE TRIAL SUBSCRIPTION — SELLER"
curl -s -X POST $BASE/stores/subscription \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"TRIAL"}'

# ─── CREATE PRODUCTS ──────────────────────────────────────────────────────────
echo -e "\n\n[8] CREATE PRODUCT 1 — Moy filtr"
PROD1=$(curl -s -X POST $BASE/products \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -F "name=Moy filtr MANN W712/75" \
  -F "price=45000" \
  -F "category=Filtrlar" \
  -F "description=Original MANN moy filtri. BMW, Mercedes uchun mos keladi. Almashtirish oralig'i 10,000 km.")
echo $PROD1
PROD1_ID=$(echo $PROD1 | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "\n[9] CREATE PRODUCT 2 — Havo filtr"
PROD2=$(curl -s -X POST $BASE/products \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -F "name=Havo filtr BOSCH S0081" \
  -F "price=38000" \
  -F "category=Filtrlar" \
  -F "description=Havo filtri BOSCH. Barcha Opel va Chevrolet modellariga mos. Yil uchun mo'ljallangan.")
echo $PROD2
PROD2_ID=$(echo $PROD2 | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "\n[10] CREATE PRODUCT 3 — Tormoz kolodkasi"
PROD3=$(curl -s -X POST $BASE/products \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -F "name=Tormoz kolodkasi BREMBO P85020" \
  -F "price=185000" \
  -F "category=Tormoz tizimi" \
  -F "description=Original Brembo tormoz kolodkalari. Oldingi o'q uchun. Nexia, Lacetti, Cobalt modellariga.")
echo $PROD3
PROD3_ID=$(echo $PROD3 | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "\n[11] CREATE PRODUCT 4 — Akkumulyator"
PROD4=$(curl -s -X POST $BASE/products \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -F "name=Akkumulyator Corteco 60Ah" \
  -F "price=890000" \
  -F "category=Elektr tizimi" \
  -F "description=60 Ah 540A akkumulyator. 2 yil kafolat. Barcha avtomobillarga mos keluvchi universal model.")
echo $PROD4
PROD4_ID=$(echo $PROD4 | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "\n[12] CREATE PRODUCT 5 — Amortizator"
PROD5=$(curl -s -X POST $BASE/products \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -F "name=Amortizator KYB Excel-G 341291" \
  -F "price=320000" \
  -F "category=Osma tizimi" \
  -F "description=KYB Excel-G gaz amortizatori. Damas va Matiz uchun. Oldingi o'q. Juftlik narxi.")
echo $PROD5
PROD5_ID=$(echo $PROD5 | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "\n\nProduct IDlar:"
echo "P1: $PROD1_ID"
echo "P2: $PROD2_ID"
echo "P3: $PROD3_ID"
echo "P4: $PROD4_ID"
echo "P5: $PROD5_ID"

# ─── ADMIN: GET PENDING ───────────────────────────────────────────────────────
echo -e "\n[13] ADMIN — Pending products ro'yhati"
curl -s $BASE/admin/products/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ─── ADMIN: APPROVE PRODUCTS ──────────────────────────────────────────────────
echo -e "\n\n[14] ADMIN — Product 1 ni APPROVE qilish"
curl -s -X PATCH $BASE/admin/products/$PROD1_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n[15] ADMIN — Product 2 ni APPROVE qilish"
curl -s -X PATCH $BASE/admin/products/$PROD2_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n[16] ADMIN — Product 3 ni APPROVE qilish"
curl -s -X PATCH $BASE/admin/products/$PROD3_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n[17] ADMIN — Product 4 ni APPROVE qilish"
curl -s -X PATCH $BASE/admin/products/$PROD4_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n[18] ADMIN — Product 5 ni REJECT qilish (test)"
curl -s -X PATCH $BASE/admin/products/$PROD5_ID/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Rasm yuklanmagan, iltimos rasm qoshing"}'

# ─── PUBLIC: GET PRODUCTS ─────────────────────────────────────────────────────
echo -e "\n\n[19] PUBLIC — Barcha approved mahsulotlar"
curl -s "$BASE/products"

echo -e "\n\n[20] PUBLIC — Filtrlar: Filtrlar kategoriyasi, max 50000 som"
curl -s "$BASE/products?category=Filtrlar&maxPrice=50000"

echo -e "\n\n[21] PUBLIC — Bitta mahsulot detail"
curl -s "$BASE/products/$PROD1_ID"

# ─── SELLER: MY PRODUCTS ─────────────────────────────────────────────────────
echo -e "\n\n[22] SELLER — O'z mahsulotlari"
curl -s "$BASE/products/my" \
  -H "Authorization: Bearer $SELLER_TOKEN"

# ─── PUBLIC: GET STORE ───────────────────────────────────────────────────────
echo -e "\n\n[23] PUBLIC — Do'kon sahifasi"
curl -s "$BASE/stores/$STORE_ID"

# ─── ADMIN: STATS ─────────────────────────────────────────────────────────────
echo -e "\n\n[24] ADMIN — Statistika dashboard"
curl -s "$BASE/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ─── ADMIN: ADD BALANCE ───────────────────────────────────────────────────────
echo -e "\n\n[25] ADMIN — Clientga 100,000 balance qo'shish"
CLIENT_ID=$(curl -s $BASE/auth/me \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
curl -s -X PATCH $BASE/admin/users/$CLIENT_ID/balance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100000}'

# ─── PLANS ────────────────────────────────────────────────────────────────────
echo -e "\n\n[26] PUBLIC — Subscription planlar"
curl -s "$BASE/stores/plans"

echo -e "\n\n=============================="
echo "  TEST YAKUNLANDI"
echo "=============================="
