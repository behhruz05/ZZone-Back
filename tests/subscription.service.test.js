/**
 * Unit tests for subscription.service.js
 * All Mongoose models are mocked — no real DB connection needed.
 */

jest.mock('../src/models/Store');
jest.mock('../src/models/User');

const Store = require('../src/models/Store');
const User  = require('../src/models/User');
const { activateSubscription } = require('../src/services/subscription.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeSeller = (overrides = {}) => ({
  _id:       'seller-1',
  balance:   500000,
  trialUsed: false,
  save:      jest.fn().mockResolvedValue(true),
  ...overrides,
});

const makeStore = (overrides = {}) => ({
  _id:                    'store-1',
  seller:                 { toString: () => 'seller-1' },
  subscriptionExpiresAt:  null,
  subscriptionPlan:       null,
  isActive:               false,
  save:                   jest.fn().mockResolvedValue(true),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('activateSubscription', () => {
  test('activates TRIAL plan for first-time user', async () => {
    const seller = makeSeller();
    const store  = makeStore();
    Store.findById.mockResolvedValue(store);
    User.findById.mockResolvedValue(seller);

    const result = await activateSubscription('TRIAL', 'store-1', 'seller-1');

    expect(seller.trialUsed).toBe(true);
    expect(seller.save).toHaveBeenCalled();
    expect(store.subscriptionPlan).toBe('TRIAL');
    expect(store.isActive).toBe(true);
    expect(result.newBalance).toBe(500000);
  });

  test('rejects TRIAL plan if already used', async () => {
    const seller = makeSeller({ trialUsed: true });
    const store  = makeStore();
    Store.findById.mockResolvedValue(store);
    User.findById.mockResolvedValue(seller);

    await expect(activateSubscription('TRIAL', 'store-1', 'seller-1'))
      .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('trial') });
  });

  test('deducts correct amount for BASIC plan', async () => {
    const seller = makeSeller({ balance: 200000 });
    const store  = makeStore();
    Store.findById.mockResolvedValue(store);
    User.findById.mockResolvedValue(seller);

    const result = await activateSubscription('BASIC', 'store-1', 'seller-1');

    expect(result.newBalance).toBe(100000); // 200000 - 100000
    expect(store.subscriptionPlan).toBe('BASIC');
    expect(store.isActive).toBe(true);
  });

  test('rejects paid plan when balance is insufficient', async () => {
    const seller = makeSeller({ balance: 50000 });
    const store  = makeStore();
    Store.findById.mockResolvedValue(store);
    User.findById.mockResolvedValue(seller);

    await expect(activateSubscription('STANDARD', 'store-1', 'seller-1'))
      .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('balance') });
  });

  test('extends subscription from current expiry if still active', async () => {
    const futureExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
    const seller = makeSeller({ balance: 300000 });
    const store  = makeStore({ subscriptionExpiresAt: futureExpiry, isActive: true });
    Store.findById.mockResolvedValue(store);
    User.findById.mockResolvedValue(seller);

    await activateSubscription('STANDARD', 'store-1', 'seller-1');

    const newExpiry = store.subscriptionExpiresAt;
    const diffDays  = Math.round((newExpiry - futureExpiry) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBe(30);
  });

  test('starts subscription from today if no active subscription', async () => {
    const seller = makeSeller({ balance: 100000 });
    const store  = makeStore({ subscriptionExpiresAt: null });
    Store.findById.mockResolvedValue(store);
    User.findById.mockResolvedValue(seller);

    const before = new Date();
    await activateSubscription('BASIC', 'store-1', 'seller-1');
    const after = new Date();

    const expiresAt = store.subscriptionExpiresAt;
    const diffMs    = expiresAt - before;
    const diffDays  = diffMs / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThanOrEqual(29.9);
    expect(diffDays).toBeLessThanOrEqual(30.1);
  });

  test('throws 400 for unknown plan name', async () => {
    Store.findById.mockResolvedValue(makeStore());
    User.findById.mockResolvedValue(makeSeller());

    await expect(activateSubscription('GOLD', 'store-1', 'seller-1'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 403 if seller does not own the store', async () => {
    const seller = makeSeller({ _id: 'seller-other' });
    const store  = makeStore(); // store.seller = 'seller-1'
    Store.findById.mockResolvedValue(store);
    User.findById.mockResolvedValue(seller);

    await expect(activateSubscription('BASIC', 'store-1', 'seller-other'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  test('throws 404 if store not found', async () => {
    Store.findById.mockResolvedValue(null);
    User.findById.mockResolvedValue(makeSeller());

    await expect(activateSubscription('BASIC', 'missing-store', 'seller-1'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});
