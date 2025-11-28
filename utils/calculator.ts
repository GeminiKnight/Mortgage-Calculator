import { AmortizationItem, LoanResultDetail, RepaymentMethod, LoanParams, LoanType, PrepaymentResult, PrepaymentYearData, CalculationMethod } from '../types';

// Calculate monthly payment for Equal Principal & Interest (等额本息)
const calculateEqualInterest = (principal: number, yearRate: number, years: number): LoanResultDetail => {
  const months = years * 12;
  const monthRate = yearRate / 100 / 12;

  // Formula: P * [i * (1+i)^n] / [(1+i)^n - 1]
  const pow = Math.pow(1 + monthRate, months);
  const monthlyPayment = (principal * monthRate * pow) / (pow - 1);
  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - principal;

  const schedule: AmortizationItem[] = [];
  let remaining = principal;

  for (let i = 1; i <= months; i++) {
    const interestPayment = remaining * monthRate;
    const principalPayment = monthlyPayment - interestPayment;
    remaining -= principalPayment;
    // Fix precision issues at the end
    if (i === months) remaining = 0;

    schedule.push({
      month: i,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      remainingPrincipal: Math.max(0, remaining),
    });
  }

  return {
    totalPayment,
    totalInterest,
    loanAmount: principal,
    years,
    monthlyPayment,
    schedule,
  };
};

// Calculate monthly payment for Equal Principal (等额本金)
const calculateEqualPrincipal = (principal: number, yearRate: number, years: number): LoanResultDetail => {
  const months = years * 12;
  const monthRate = yearRate / 100 / 12;

  const monthlyPrincipal = principal / months;
  const schedule: AmortizationItem[] = [];
  let totalInterest = 0;
  let remaining = principal;

  for (let i = 1; i <= months; i++) {
    const interestPayment = remaining * monthRate;
    const payment = monthlyPrincipal + interestPayment;
    totalInterest += interestPayment;
    remaining -= monthlyPrincipal;

    schedule.push({
      month: i,
      payment: payment,
      principal: monthlyPrincipal,
      interest: interestPayment,
      remainingPrincipal: Math.max(0, remaining),
    });
  }

  const totalPayment = principal + totalInterest;
  const firstMonth = schedule[0].payment;
  const secondMonth = schedule[1]?.payment || 0;
  const decrease = months > 1 ? firstMonth - secondMonth : 0;

  return {
    totalPayment,
    totalInterest,
    loanAmount: principal,
    years,
    monthlyPayment: firstMonth,
    monthlyDecrease: decrease,
    schedule,
  };
};

// Combine results for Combination Loans
export const calculateLoan = (
  principalCommercial: number, // in Yuan
  rateCommercial: number,
  principalProvident: number, // in Yuan
  rateProvident: number,
  years: number
): Record<RepaymentMethod, LoanResultDetail> => {
  
  // 1. Equal Interest (Equal P & I)
  const commEI = calculateEqualInterest(principalCommercial, rateCommercial, years);
  const provEI = calculateEqualInterest(principalProvident, rateProvident, years);
  
  // Merge Schedules
  const scheduleEI = commEI.schedule.map((item, idx) => ({
    month: item.month,
    payment: item.payment + provEI.schedule[idx].payment,
    principal: item.principal + provEI.schedule[idx].principal,
    interest: item.interest + provEI.schedule[idx].interest,
    remainingPrincipal: item.remainingPrincipal + provEI.schedule[idx].remainingPrincipal,
  }));

  const resultEI: LoanResultDetail = {
    totalPayment: commEI.totalPayment + provEI.totalPayment,
    totalInterest: commEI.totalInterest + provEI.totalInterest,
    loanAmount: principalCommercial + principalProvident,
    years,
    monthlyPayment: commEI.monthlyPayment + provEI.monthlyPayment,
    schedule: scheduleEI,
  };

  // 2. Equal Principal
  const commEP = calculateEqualPrincipal(principalCommercial, rateCommercial, years);
  const provEP = calculateEqualPrincipal(principalProvident, rateProvident, years);

  const scheduleEP = commEP.schedule.map((item, idx) => ({
    month: item.month,
    payment: item.payment + provEP.schedule[idx].payment,
    principal: item.principal + provEP.schedule[idx].principal,
    interest: item.interest + provEP.schedule[idx].interest,
    remainingPrincipal: item.remainingPrincipal + provEP.schedule[idx].remainingPrincipal,
  }));

  const resultEP: LoanResultDetail = {
    totalPayment: commEP.totalPayment + provEP.totalPayment,
    totalInterest: commEP.totalInterest + provEP.totalInterest,
    loanAmount: principalCommercial + principalProvident,
    years,
    monthlyPayment: commEP.monthlyPayment + provEP.monthlyPayment,
    monthlyDecrease: (commEP.monthlyDecrease || 0) + (provEP.monthlyDecrease || 0),
    schedule: scheduleEP,
  };

  return {
    [RepaymentMethod.EQUAL_INTEREST]: resultEI,
    [RepaymentMethod.EQUAL_PRINCIPAL]: resultEP,
  };
};

// --- Prepayment Logic ---

export const calculatePrepayment = (
  params: LoanParams,
  method: RepaymentMethod,
  prepaymentAmountYearly: number // Yuan, every 12 months
): PrepaymentResult => {
  const years = params.years;
  const totalMonths = years * 12;

  // Determine Principals and Rates
  let commPrincipal = 0;
  let provPrincipal = 0;
  let commRate = params.commercialRate / 100 / 12;
  let provRate = params.providentRate / 100 / 12;

  // Re-calculate Initial Principals (logic copied from App.tsx handling)
  if (params.loanType === LoanType.COMBINATION) {
      commPrincipal = params.commercialAmount * 10000;
      provPrincipal = params.providentAmount * 10000;
  } else {
      let totalLoan = 0;
      if (params.calculationMethod === CalculationMethod.BY_TOTAL_PRICE) {
          totalLoan = params.totalPrice * 10000 * (1 - params.downPaymentRatio / 100);
      } else {
          totalLoan = params.loanAmount * 10000;
      }
      if (params.loanType === LoanType.COMMERCIAL) commPrincipal = totalLoan;
      else provPrincipal = totalLoan;
  }

  // Baseline Calculation (No Prepayment)
  const baseline = calculateLoan(commPrincipal, params.commercialRate, provPrincipal, params.providentRate, years);
  const originalTotalInterest = baseline[method].totalInterest;

  // Simulation State
  let currCommP = commPrincipal;
  let currProvP = provPrincipal;
  
  let newTotalInterest = 0;
  const schedule: PrepaymentYearData[] = [];

  // Helper to get monthly payment components
  // principal: current remaining principal
  // monthRate: monthly interest rate
  // remainingMonths: months remaining in the ORIGINAL loan term (not shortened)
  const getMonthlyPayment = (principal: number, monthRate: number, remainingMonths: number, type: RepaymentMethod) => {
    if (principal <= 0.1) return { payment: 0, interest: 0, principalPart: 0 };
    
    const interest = principal * monthRate;
    let payment = 0;
    let principalPart = 0;

    if (type === RepaymentMethod.EQUAL_INTEREST) {
       // Recalculate EMI based on new principal and remaining time
       const pow = Math.pow(1 + monthRate, remainingMonths);
       if (pow === Infinity) {
          payment = principal; // Safety fallback
       } else {
          payment = (principal * monthRate * pow) / (pow - 1);
       }
       principalPart = payment - interest;
    } else {
       // Equal Principal: Principal / Remaining Months
       principalPart = principal / remainingMonths;
       payment = principalPart + interest;
    }
    return { payment, interest, principalPart };
  };

  for (let m = 1; m <= totalMonths; m++) {
      // Remaining months INCLUDING this month. 
      // e.g., if total 360. At m=1, remaining is 360. At m=360, remaining is 1.
      const remainingMonths = totalMonths - m + 1;
      
      // 1. Calculate Standard Monthly Payment for this month
      const commPay = getMonthlyPayment(currCommP, commRate, remainingMonths, method);
      const provPay = getMonthlyPayment(currProvP, provRate, remainingMonths, method);

      // 2. Pay Interest
      newTotalInterest += (commPay.interest + provPay.interest);

      // 3. Pay Scheduled Principal
      currCommP -= commPay.principalPart;
      currProvP -= provPay.principalPart;
      
      if (currCommP < 0) currCommP = 0;
      if (currProvP < 0) currProvP = 0;

      // 4. Check for Prepayment (Every December, i.e., m % 12 == 0)
      if (m % 12 === 0 && (currCommP > 0 || currProvP > 0)) {
          let availablePrepay = prepaymentAmountYearly;
          
          // Strategy: Pay off Commercial First (usually higher rate), then Provident
          if (currCommP > 0) {
              const payComm = Math.min(currCommP, availablePrepay);
              currCommP -= payComm;
              availablePrepay -= payComm;
          }
          
          if (availablePrepay > 0 && currProvP > 0) {
              const payProv = Math.min(currProvP, availablePrepay);
              currProvP -= payProv;
              availablePrepay -= payProv;
          }

          // Snapshot for Year End
          // We need "Next Year Monthly Payment". This is the payment for m+1.
          // Remaining months for next month calculation = Total - m
          const nextRemainingMonths = totalMonths - m;
          
          let nextPayment = 0;
          
          if (nextRemainingMonths > 0) {
            const nextComm = getMonthlyPayment(currCommP, commRate, nextRemainingMonths, method);
            const nextProv = getMonthlyPayment(currProvP, provRate, nextRemainingMonths, method);
            nextPayment = nextComm.payment + nextProv.payment;
          }

          schedule.push({
              year: m / 12,
              remainingPrincipal: currCommP + currProvP,
              nextYearMonthlyPayment: nextPayment,
              interestSavedToDate: 0, 
          });
      }
  }

  // Fill remaining years with 0 if paid off early
  const lastYear = schedule.length > 0 ? schedule[schedule.length - 1].year : 0;
  for (let y = lastYear + 1; y <= years; y++) {
      schedule.push({
          year: y,
          remainingPrincipal: 0,
          nextYearMonthlyPayment: 0,
          interestSavedToDate: 0
      });
  }

  return {
      savedInterest: originalTotalInterest - newTotalInterest,
      schedule
  };
};