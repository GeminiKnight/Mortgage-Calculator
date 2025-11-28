import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LoanParams, CalculationResult } from '../types';

interface LoanContextType {
  params: LoanParams | null;
  result: CalculationResult | null;
  setLoanData: (params: LoanParams, result: CalculationResult) => void;
  clearLoanData: () => void;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [params, setParams] = useState<LoanParams | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const setLoanData = (newParams: LoanParams, newResult: CalculationResult) => {
    setParams(newParams);
    setResult(newResult);
  };

  const clearLoanData = () => {
    setParams(null);
    setResult(null);
  };

  return (
    <LoanContext.Provider value={{ params, result, setLoanData, clearLoanData }}>
      {children}
    </LoanContext.Provider>
  );
};

export const useLoanData = () => {
  const context = useContext(LoanContext);
  if (!context) {
    throw new Error('useLoanData must be used within a LoanProvider');
  }
  return context;
};