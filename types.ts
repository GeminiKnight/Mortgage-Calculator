export enum LoanType {
  COMMERCIAL = 'COMMERCIAL', // 商业贷款
  PROVIDENT = 'PROVIDENT',   // 公积金贷款
  COMBINATION = 'COMBINATION' // 组合贷款
}

export enum CalculationMethod {
  BY_TOTAL_PRICE = 'BY_TOTAL_PRICE', // 按房价总额
  BY_LOAN_AMOUNT = 'BY_LOAN_AMOUNT'  // 按贷款总额
}

export enum RepaymentMethod {
  EQUAL_INTEREST = 'EQUAL_INTEREST', // 等额本息
  EQUAL_PRINCIPAL = 'EQUAL_PRINCIPAL' // 等额本金
}

export interface LoanParams {
  loanType: LoanType;
  calculationMethod: CalculationMethod;
  totalPrice: number; // 万元
  downPaymentRatio: number; // Percentage 0-100
  loanAmount: number; // 万元 (Used if calculationMethod is BY_LOAN_AMOUNT or calculated)
  commercialAmount: number; // 万元 (For combination)
  providentAmount: number; // 万元 (For combination)
  years: number;
  commercialRate: number; // Percentage
  providentRate: number; // Percentage
}

export interface AmortizationItem {
  month: number;
  payment: number; // Monthly payment
  principal: number; // Principal part
  interest: number; // Interest part
  remainingPrincipal: number;
}

export interface LoanResultDetail {
  totalPayment: number;
  totalInterest: number;
  loanAmount: number;
  years: number;
  monthlyPayment: number; // For Equal Interest (or first month for Equal Principal)
  monthlyDecrease?: number; // For Equal Principal
  schedule: AmortizationItem[];
}

export interface CalculationResult {
  [RepaymentMethod.EQUAL_INTEREST]: LoanResultDetail;
  [RepaymentMethod.EQUAL_PRINCIPAL]: LoanResultDetail;
}

export interface PrepaymentYearData {
  year: number;
  remainingPrincipal: number; // End of year
  nextYearMonthlyPayment: number; // Payment amount for the first month of next year
  interestSavedToDate: number; // Cumulative or total saved for the scenario
}

export interface PrepaymentResult {
  savedInterest: number;
  schedule: PrepaymentYearData[];
}