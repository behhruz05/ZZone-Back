const User     = require('../models/User');
const Store    = require('../models/Store');
const ApiError = require('../utils/ApiError');
const { SUBSCRIPTION_PLANS } = require('../utils/constants');

/**
 * Activates or renews a subscription plan for a seller's store.
 *
 * Business rules:
 * - TRIAL plan: free, can only be used once (trialUsed flag on User)
 * - Paid plans: deduct price from user.balance
 * - If store already has an active subscription, extend from current expiry date
 * - Otherwise start from today
 *
 * @param {string}   planName  - 'TRIAL' | 'BASIC' | 'STANDARD' | 'PREMIUM'
 * @param {ObjectId} storeId   - Store._id
 * @param {ObjectId} userId    - User._id (the seller)
 * @returns {{ store, newBalance }}
 */
const activateSubscription = async (planName, storeId, userId) => {
  const plan = SUBSCRIPTION_PLANS[planName];
  if (!plan) {
    throw new ApiError(
      400,
      `Invalid plan. Available: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}`
    );
  }

  // Fetch store and user in parallel
  const [store, user] = await Promise.all([
    Store.findById(storeId),
    User.findById(userId),
  ]);

  if (!store) throw new ApiError(404, 'Store not found');
  if (!user)  throw new ApiError(404, 'User not found');

  // Safety check: seller can only activate their own store
  if (store.seller.toString() !== userId.toString()) {
    throw new ApiError(403, 'You do not own this store');
  }

  // ─── Trial logic ──────────────────────────────────────────────────────────
  if (planName === 'TRIAL') {
    if (user.trialUsed) {
      throw new ApiError(400, 'Free trial has already been used');
    }
    user.trialUsed = true;
    await user.save();

  // ─── Paid plan logic ──────────────────────────────────────────────────────
  } else {
    if (user.balance < plan.price) {
      throw new ApiError(
        400,
        `Insufficient balance. Required: ${plan.price}, your balance: ${user.balance}`
      );
    }
    user.balance -= plan.price;
    await user.save();
  }

  // ─── Calculate new expiration date ───────────────────────────────────────
  // If store has a future expiry, extend from there; otherwise start from now
  const now      = new Date();
  const baseDate = store.subscriptionExpiresAt && store.subscriptionExpiresAt > now
    ? store.subscriptionExpiresAt
    : now;

  const expiresAt = new Date(
    baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
  );

  store.subscriptionPlan      = planName;
  store.subscriptionExpiresAt = expiresAt;
  store.isActive              = true;
  await store.save();

  return { store, newBalance: user.balance };
};

module.exports = { activateSubscription };
