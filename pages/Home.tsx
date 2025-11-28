import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoanData } from '../context/LoanContext';
import { LoanType, CalculationMethod, LoanParams } from '../types';
import { 
    TERM_OPTIONS, 
    DOWN_PAYMENT_OPTIONS,
    COMMERCIAL_RATE_OPTIONS,
    PROVIDENT_RATE_OPTIONS 
} from '../constants';
import { calculateLoan } from '../utils/calculator';
import { InputRow } from '../components/InputRow';
import { RateSheet } from '../components/RateSheet';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { setLoanData } = useLoanData();

  // --- State ---
  const [loanType, setLoanType] = useState<LoanType>(LoanType.COMMERCIAL);
  const [calcMethod, setCalcMethod] = useState<CalculationMethod>(CalculationMethod.BY_TOTAL_PRICE);
  
  // Inputs
  const [totalPrice, setTotalPrice] = useState<string>(''); // 万元
  const [loanAmount, setLoanAmount] = useState<string>(''); // 万元
  const [commAmount, setCommAmount] = useState<string>(''); // 万元 (Combo)
  const [provAmount, setProvAmount] = useState<string>(''); // 万元 (Combo)
  
  const [downPaymentRatio, setDownPaymentRatio] = useState<number>(30);
  const [years, setYears] = useState<number>(30);
  
  // Rate States
  const [commRate, setCommRate] = useState<string>(COMMERCIAL_RATE_OPTIONS[0].value.toString());
  const [commRateDesc, setCommRateDesc] = useState<string>(`(${COMMERCIAL_RATE_OPTIONS[0].label})`);
  
  const [provRate, setProvRate] = useState<string>(PROVIDENT_RATE_OPTIONS[0].value.toString());
  const [provRateDesc, setProvRateDesc] = useState<string>(`(${PROVIDENT_RATE_OPTIONS[0].label})`);

  // Rate Sheet Control
  const [showRateSheet, setShowRateSheet] = useState(false);
  const [activeRateType, setActiveRateType] = useState<'COMMERCIAL' | 'PROVIDENT'>('COMMERCIAL');

  // --- Handlers ---

  const handleRateClick = (type: 'COMMERCIAL' | 'PROVIDENT') => {
      setActiveRateType(type);
      setShowRateSheet(true);
  };

  const handleRateConfirm = (rate: string, label: string) => {
      if (activeRateType === 'COMMERCIAL') {
          setCommRate(rate);
          setCommRateDesc(label);
      } else {
          setProvRate(rate);
          setProvRateDesc(label);
      }
  };

  const handleCalculate = () => {
    // Basic Validation
    if (loanType === LoanType.COMBINATION) {
      if (!commAmount && !provAmount) {
        alert("请输入贷款金额");
        return;
      }
    } else if (calcMethod === CalculationMethod.BY_LOAN_AMOUNT) {
      if (!loanAmount) {
        alert("请输入贷款金额");
        return;
      }
    } else {
      if (!totalPrice) {
        alert("请输入房价总额");
        return;
      }
    }

    let finalCommPrincipal = 0;
    let finalProvPrincipal = 0;

    // Determine Principals based on mode
    if (loanType === LoanType.COMBINATION) {
      finalCommPrincipal = (parseFloat(commAmount) || 0) * 10000;
      finalProvPrincipal = (parseFloat(provAmount) || 0) * 10000;
    } else {
      let totalLoan = 0;
      if (calcMethod === CalculationMethod.BY_TOTAL_PRICE) {
        const price = parseFloat(totalPrice) * 10000;
        totalLoan = price * (1 - downPaymentRatio / 100);
      } else {
        totalLoan = parseFloat(loanAmount) * 10000;
      }

      if (loanType === LoanType.COMMERCIAL) {
        finalCommPrincipal = totalLoan;
      } else {
        finalProvPrincipal = totalLoan;
      }
    }

    const params: LoanParams = {
        loanType,
        calculationMethod: calcMethod,
        totalPrice: parseFloat(totalPrice) || 0,
        downPaymentRatio,
        loanAmount: parseFloat(loanAmount) || 0,
        commercialAmount: parseFloat(commAmount) || 0,
        providentAmount: parseFloat(provAmount) || 0,
        years,
        commercialRate: parseFloat(commRate),
        providentRate: parseFloat(provRate),
    };

    const res = calculateLoan(
      finalCommPrincipal,
      parseFloat(commRate),
      finalProvPrincipal,
      parseFloat(provRate),
      years
    );

    setLoanData(params, res);
    navigate('/result');
  };

  const renderTopTabs = () => (
    <div className="flex bg-white pt-2 px-2 sticky top-0 z-20 shadow-sm justify-between">
      <div className="flex flex-1">
        {[
            { id: LoanType.COMMERCIAL, label: '商业贷款' },
            { id: LoanType.PROVIDENT, label: '公积金贷款' },
            { id: LoanType.COMBINATION, label: '组合贷款' },
        ].map((tab) => (
            <button
            key={tab.id}
            onClick={() => setLoanType(tab.id)}
            className={`flex-1 py-3 text-[15px] font-medium border-b-[3px] transition-all whitespace-nowrap ${
                loanType === tab.id
                ? 'border-red-500 text-slate-900'
                : 'border-transparent text-gray-500'
            }`}
            >
            {tab.label}
            </button>
        ))}
      </div>
    </div>
  );

  const renderMethodToggle = () => {
    if (loanType === LoanType.COMBINATION) return null;

    return (
      <InputRow label="计算方式">
        <div className="flex space-x-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${calcMethod === CalculationMethod.BY_TOTAL_PRICE ? 'border-red-500' : 'border-gray-300'}`}>
              {calcMethod === CalculationMethod.BY_TOTAL_PRICE && <div className="w-2 h-2 rounded-full bg-red-500" />}
            </div>
            <input 
                type="radio" 
                className="hidden" 
                checked={calcMethod === CalculationMethod.BY_TOTAL_PRICE} 
                onChange={() => setCalcMethod(CalculationMethod.BY_TOTAL_PRICE)} 
            />
            <span className={calcMethod === CalculationMethod.BY_TOTAL_PRICE ? 'text-gray-800' : 'text-gray-500'}>按房价总额</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
             <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${calcMethod === CalculationMethod.BY_LOAN_AMOUNT ? 'border-red-500' : 'border-gray-300'}`}>
              {calcMethod === CalculationMethod.BY_LOAN_AMOUNT && <div className="w-2 h-2 rounded-full bg-red-500" />}
            </div>
            <input 
                type="radio" 
                className="hidden" 
                checked={calcMethod === CalculationMethod.BY_LOAN_AMOUNT} 
                onChange={() => setCalcMethod(CalculationMethod.BY_LOAN_AMOUNT)} 
            />
            <span className={calcMethod === CalculationMethod.BY_LOAN_AMOUNT ? 'text-gray-800' : 'text-gray-500'}>按贷款总额</span>
          </label>
        </div>
      </InputRow>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {renderTopTabs()}

      <div className="p-5 flex-1 flex flex-col">
          <div className="bg-white rounded-lg">
            {renderMethodToggle()}

            {/* Amount Inputs */}
            {loanType !== LoanType.COMBINATION && calcMethod === CalculationMethod.BY_TOTAL_PRICE && (
              <>
                <InputRow label="房价总额" suffix="万元">
                  <input
                    type="number"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    placeholder="请输入"
                    className="text-right flex-1 min-w-0 outline-none text-gray-800 font-medium placeholder-gray-300"
                  />
                </InputRow>
                <InputRow label="首付比例" isSelect suffix="">
                    <select 
                        value={downPaymentRatio} 
                        onChange={(e) => setDownPaymentRatio(Number(e.target.value))}
                        className="appearance-none bg-transparent text-right w-full outline-none text-gray-800 font-medium pr-1"
                        style={{direction: 'rtl'}}
                    >
                        {DOWN_PAYMENT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </InputRow>
              </>
            )}

            {loanType !== LoanType.COMBINATION && calcMethod === CalculationMethod.BY_LOAN_AMOUNT && (
              <InputRow label="贷款总额" suffix="万元">
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="请输入"
                  className="text-right flex-1 min-w-0 outline-none text-gray-800 font-medium placeholder-gray-300"
                />
              </InputRow>
            )}

            {loanType === LoanType.COMBINATION && (
                <>
                    <InputRow label="公积金贷款金额" suffix="万元">
                        <input
                        type="number"
                        value={provAmount}
                        onChange={(e) => setProvAmount(e.target.value)}
                        placeholder="请输入"
                        className="text-right flex-1 min-w-0 outline-none text-gray-800 font-medium placeholder-gray-300"
                        />
                    </InputRow>
                    <InputRow label="商业贷款金额" suffix="万元">
                        <input
                        type="number"
                        value={commAmount}
                        onChange={(e) => setCommAmount(e.target.value)}
                        placeholder="请输入"
                        className="text-right flex-1 min-w-0 outline-none text-gray-800 font-medium placeholder-gray-300"
                        />
                    </InputRow>
                </>
            )}

            {/* Common Fields */}
            <InputRow label={loanType === LoanType.PROVIDENT ? "公积金按揭年数" : (loanType === LoanType.COMBINATION ? "组合贷款年限" : "按揭年数")} isSelect>
                 <select 
                        value={years} 
                        onChange={(e) => setYears(Number(e.target.value))}
                        className="appearance-none bg-transparent text-right w-full outline-none text-gray-800 font-medium pr-1"
                        style={{direction: 'rtl'}}
                    >
                        {TERM_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
            </InputRow>

            {/* Interest Rates */}
            {(loanType === LoanType.COMMERCIAL || loanType === LoanType.COMBINATION) && (
              <InputRow label="商业利率" isSelect>
                 <button 
                    onClick={() => handleRateClick('COMMERCIAL')}
                    className="flex items-center justify-end w-full text-right outline-none text-gray-800 font-medium truncate"
                 >
                    {commRate}%<span className="text-gray-400 text-xs ml-1 text-nowrap truncate max-w-[120px]">{commRateDesc}</span>
                 </button>
              </InputRow>
            )}
             {(loanType === LoanType.PROVIDENT || loanType === LoanType.COMBINATION) && (
              <InputRow label="公积金利率" isSelect>
                 <button 
                    onClick={() => handleRateClick('PROVIDENT')}
                    className="flex items-center justify-end w-full text-right outline-none text-gray-800 font-medium truncate"
                 >
                    {provRate}%<span className="text-gray-400 text-xs ml-1 text-nowrap truncate max-w-[120px]">{provRateDesc}</span>
                 </button>
              </InputRow>
            )}
            
             {(loanType === LoanType.COMMERCIAL || loanType === LoanType.COMBINATION) && (
                <div className="flex justify-end pt-1">
                    <span className="text-xs text-gray-400">最新LPR (2025年5月): 3.50%</span>
                </div>
             )}
          </div>

          <div className="mt-8">
            <button
              onClick={handleCalculate}
              className="w-full bg-[#f04142] text-white text-lg font-bold py-3 rounded-md shadow-lg active:scale-95 transition-transform"
            >
              开始计算
            </button>
          </div>
          
          <div className="mt-auto pt-8 text-center text-xs text-gray-400">
             免责声明：内容仅供参考，具体以各银行政策为准。
          </div>
      </div>

      <RateSheet 
        isOpen={showRateSheet}
        onClose={() => setShowRateSheet(false)}
        title={activeRateType === 'COMMERCIAL' ? '商业贷款利率' : '公积金贷款利率'}
        options={activeRateType === 'COMMERCIAL' ? COMMERCIAL_RATE_OPTIONS : PROVIDENT_RATE_OPTIONS}
        initialValue={activeRateType === 'COMMERCIAL' ? commRate : provRate}
        onConfirm={handleRateConfirm}
      />
    </div>
  );
};