const axios       = require('axios');
const AutoListing = require('../models/AutoListing');
const logger      = require('../config/logger');

const OLX_BASE_URL   = 'https://www.olx.uz/api/v1/offers/';
const CATEGORY_ID    = 108;   // passenger cars
const PAGE_SIZE      = 40;
const PAGES_TO_FETCH = 3;     // 3 × 40 = 120 listings max

const OLX_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept':     'application/json',
};

// ─── Param parser ─────────────────────────────────────────────────────────────
// OLX params format: [{ key: 'motor_year', value: { key: '2018', label: '2018' } }, ...]
function extractParam(paramsArr, key) {
  if (!Array.isArray(paramsArr)) return null;
  const entry = paramsArr.find((p) => p.key === key);
  if (!entry) return null;
  // value can be an object { key, label } or a plain primitive
  if (entry.value && typeof entry.value === 'object') {
    return entry.value.label ?? entry.value.key ?? null;
  }
  return entry.value ?? null;
}

function toNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(String(val).replace(/\D/g, ''));
  return isNaN(n) ? null : n;
}

// ─── Single offer → AutoListing document shape ────────────────────────────────
function mapOffer(offer) {
  const paramsArr = offer.params || [];

  // Photos — use 400x300 thumbnail size
  const photos = (offer.photos || []).map((ph) => {
    const link = (ph.link || '').replace('{width}x{height}', '400x300');
    return { url: link };
  });

  // Price block — OLX puts price inside params array with key "price"
  const priceParam  = paramsArr.find((p) => p.key === 'price');
  const priceBlock  = priceParam?.value || offer.price?.value || {};
  const priceValue  = priceBlock.value ?? 0;
  const priceCurrency    = priceBlock.currency ?? 'UZS';
  const priceNegotiable  = !!(priceBlock.negotiable || priceBlock.arranged);
  const priceLabel       = priceBlock.label ?? '';

  // Location
  const loc      = offer.location || {};
  const cityName = loc.city?.name     ?? loc.city     ?? '';
  const distName = loc.district?.name ?? loc.district ?? '';
  const regName  = loc.region?.name   ?? loc.region   ?? '';

  return {
    olxId:       offer.id,
    title:       offer.title       || '',
    url:         offer.url         || '',
    description: offer.description || '',

    price: {
      value:      typeof priceValue === 'number' ? priceValue : toNumber(priceValue) ?? 0,
      currency:   priceCurrency,
      negotiable: priceNegotiable,
      label:      priceLabel,
    },

    params: {
      model:        extractParam(paramsArr, 'model')              || '',
      year:         toNumber(extractParam(paramsArr, 'motor_year')),
      mileage:      toNumber(extractParam(paramsArr, 'motor_mileage')),
      transmission: extractParam(paramsArr, 'transmission_type')  || '',
      color:        extractParam(paramsArr, 'color')              || '',
      fuelType:     extractParam(paramsArr, 'fuel_type')          || '',
      bodyType:     extractParam(paramsArr, 'car_body')           || '',
      condition:    extractParam(paramsArr, 'condition')          || '',
    },

    photos,

    location: {
      city:     cityName,
      district: distName,
      region:   regName,
    },

    sellerName:   offer.user?.name    ?? offer.contact?.name ?? '',
    olxCreatedAt: offer.created_time  ? new Date(offer.created_time) : null,
    fetchedAt:    new Date(),
  };
}

// ─── Fetch one page from OLX ──────────────────────────────────────────────────
async function fetchPage(offset) {
  const url = `${OLX_BASE_URL}?offset=${offset}&limit=${PAGE_SIZE}&category_id=${CATEGORY_ID}&sort_by=created_at:desc`;
  const response = await axios.get(url, {
    headers: OLX_HEADERS,
    timeout: 15_000,
  });
  return response.data?.data ?? [];
}

// ─── Main export: fetchAndSave ────────────────────────────────────────────────
async function fetchAndSave() {
  let total   = 0;
  let saved   = 0;
  let updated = 0;
  const errors = [];

  for (let page = 0; page < PAGES_TO_FETCH; page++) {
    const offset = page * PAGE_SIZE;
    let offers;

    try {
      offers = await fetchPage(offset);
    } catch (err) {
      logger.error({ err, offset }, 'OLX: failed to fetch page');
      errors.push({ offset, message: err.message });
      continue;
    }

    if (!offers || offers.length === 0) {
      logger.info({ offset }, 'OLX: no more offers, stopping early');
      break;
    }

    total += offers.length;

    for (const offer of offers) {
      try {
        const doc = mapOffer(offer);

        const result = await AutoListing.findOneAndUpdate(
          { olxId: doc.olxId },
          { $set: doc },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // If the document was created (upserted), createdAt equals updatedAt
        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          saved++;
        } else {
          updated++;
        }
      } catch (err) {
        logger.error({ err, olxId: offer.id }, 'OLX: failed to upsert offer');
        errors.push({ olxId: offer.id, message: err.message });
      }
    }
  }

  return { saved, updated, total, errors };
}

module.exports = { fetchAndSave };
