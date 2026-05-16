// Deterministic Non-QM calculation engine (DSCR + LTV + basic income)

export type DSCRInputs = {
  grossMonthlyRent: number;       // market rent or lease rent
  piti: number;                    // principal + interest + taxes + insurance
  hoa?: number;                    // HOA dues monthly
};
export type DSCRResult = {
  dscr: number;                    // ratio
  monthlyDebtService: number;
  formula: string;
  tier: "strong" | "qualifying" | "weak" | "fail";
};

export function calcDSCR({ grossMonthlyRent, piti, hoa = 0 }: DSCRInputs): DSCRResult {
  const monthlyDebtService = piti + hoa;
  const dscr = monthlyDebtService > 0 ? grossMonthlyRent / monthlyDebtService : 0;
  let tier: DSCRResult["tier"] = "fail";
  if (dscr >= 1.25) tier = "strong";
  else if (dscr >= 1.10) tier = "qualifying";
  else if (dscr >= 1.0) tier = "weak";
  return {
    dscr: round(dscr, 3),
    monthlyDebtService: round(monthlyDebtService, 2),
    formula: "DSCR = Gross Monthly Rent / (PITI + HOA)",
    tier,
  };
}

export type LTVInputs = { loanAmount: number; propertyValue: number };
export function calcLTV({ loanAmount, propertyValue }: LTVInputs) {
  const ltv = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;
  return { ltv: round(ltv, 2), formula: "LTV = Loan Amount / Property Value × 100" };
}

export type BankStatementInputs = {
  monthlyDeposits: number[];       // 12 or 24 months
  expenseFactor?: number;          // 0.5 default for business
  personal?: boolean;
};
export function calcBankStatementIncome({ monthlyDeposits, expenseFactor = 0.5, personal = false }: BankStatementInputs) {
  const total = monthlyDeposits.reduce((a, b) => a + b, 0);
  const months = monthlyDeposits.length || 1;
  const avg = total / months;
  const qualifying = personal ? avg : avg * (1 - expenseFactor);
  return {
    months, avgMonthlyDeposit: round(avg, 2),
    qualifyingMonthlyIncome: round(qualifying, 2),
    formula: personal
      ? "Income = Avg(monthly deposits)"
      : `Income = Avg(monthly deposits) × (1 - expenseFactor=${expenseFactor})`,
  };
}

function round(n: number, d = 2) { const p = Math.pow(10, d); return Math.round(n * p) / p; }
