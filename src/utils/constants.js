/**
 * Subscription plans configuration.
 * Price is in local currency units (e.g. UZS).
 * durationDays - how long the plan lasts after activation.
 */
const SUBSCRIPTION_PLANS = {
  TRIAL:    { price: 0,       durationDays: 30 }, // Free, one-time only
  BASIC:    { price: 100000,  durationDays: 30 },
  STANDARD: { price: 300000,  durationDays: 30 },
  PREMIUM:  { price: 500000,  durationDays: 30 },
};

module.exports = { SUBSCRIPTION_PLANS };
