export interface ScoringInput {
  income: number;
  monthlyPayment: number;
  residenceType: string;
  communityBond?: string;
  jobType: string;
  workDuration: string;
  phoneDuration: string;
  hasSocial: boolean;
  hasStatement: boolean;
  hasWorkPhoto: boolean;
}

export function calculateAutoScore(input: ScoringInput): number {
  let score = 0;

  // 1. Income vs monthly payment ratio
  const ratio = input.income > 0 ? (input.monthlyPayment / input.income) * 100 : 100;
  if (ratio < 30) score += 30;
  else if (ratio < 40) score += 20;
  else if (ratio < 50) score += 10;

  // 2. Residence status
  if (input.residenceType === "own" && input.communityBond === "high") {
    score += 20;
  } else if (input.residenceType === "own") {
    score += 15;
  } else if (input.residenceType === "rent" && input.communityBond === "high") {
    score += 10;
  } else {
    score += 5;
  }

  // 3. Job type + duration
  const longTerm = input.workDuration === "more_than_1_year";
  switch (input.jobType) {
    case "government":
      score += 20;
      break;
    case "company_employee":
      score += longTerm ? 18 : 12;
      break;
    case "business_owner":
      score += longTerm ? 15 : 10;
      break;
    case "general_labor":
      score += longTerm ? 12 : 8;
      break;
    case "merchant":
      score += longTerm ? 12 : 8;
      break;
    case "rider":
    case "freelance":
      score += 8;
      break;
    case "student":
      score += 3;
      break;
    default:
      score += 5;
  }

  // 4. Documents
  if (input.hasStatement && input.hasWorkPhoto) {
    score += 20;
  } else if (input.hasStatement || input.hasWorkPhoto) {
    score += 12;
  }

  // 5. Phone duration + social
  if (input.phoneDuration === "more_than_3_years" && input.hasSocial) {
    score += 10;
  } else if (
    input.phoneDuration === "1_to_3_years" ||
    input.phoneDuration === "more_than_3_years"
  ) {
    score += 7;
  } else {
    score += 3;
  }

  return score;
}
