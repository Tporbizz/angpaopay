export interface PricingInput {
  price: number;
  downPct: number; // 0.15, 0.20, 0.25, 0.30
  months: number; // 6, 9, 12, 18
  rate: number; // monthly rate as decimal e.g. 0.015, 0.03, 0.05
  serviceFeeMonthly?: number; // from settings, default 200
  registrationFee?: number; // from settings, default 800
}

export interface PricingResult {
  downAmt: number;
  balance: number;
  hireFee: number;
  svcTotal: number;
  registration: number;
  total: number;
  monthly: number;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const { price, downPct, months, rate, serviceFeeMonthly = 200, registrationFee = 800 } = input;

  const downAmt = Math.round(price * downPct);
  const balance = price - downAmt;
  const hireFee = Math.round(balance * rate * months);
  const svcTotal = serviceFeeMonthly * months;
  const registration = registrationFee;
  const total = balance + hireFee + svcTotal + registration;
  const monthly = Math.round(total / months);

  return { downAmt, balance, hireFee, svcTotal, registration, total, monthly };
}

// Rate lookup: down% -> monthly rate
export function getBaseRate(downPct: number): number {
  if (downPct >= 0.3) return 0.015; // 1.5%/month
  if (downPct >= 0.25) return 0.03; // 3%/month
  return 0.05; // 20% or 15% down -> 5%/month
}
