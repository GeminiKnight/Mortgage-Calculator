import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoanData } from '../context/LoanContext';
import { calculatePrepayment } from '../utils/calculator';
import { RepaymentMethod } from '../types';
import { ChevronLeft } from 'lucide-react';

export const Prepayment: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { params } = useLoanData();
    
    // Default method from state or EQUAL_INTEREST
    const method = (location.state as { method?: RepaymentMethod })?.method || RepaymentMethod.EQUAL_INTEREST;

    const [prepayAmount, setPrepayAmount] = useState('');
    const [resultData, setResultData] = useState<any>(null);

    useEffect(() => {
        if (!params) {
            navigate('/');
        }
    }, [params, navigate]);

    const handleCalculate = () => {
        if (!params) return;
        if (!prepayAmount || Number(prepayAmount) <= 0) {
            alert('请输入有效的提前还款金额');
            return;
        }
        const res = calculatePrepayment(params, method, Number(prepayAmount) * 10000);
        setResultData(res);
    };

    const fmt = (num: number) => Math.round(num).toLocaleString('en-US');
    const fmtWan = (num: number) => (num / 10000).toFixed(2);

    if (!params) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
             <div className="flex items-center p-4 border-b border-gray-100 bg-white shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="mr-2">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h2 className="text-lg font-bold text-gray-800">提前还款计算</h2>
            </div>

            <div className="p-4 flex-1">
                 {/* Input Card */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-red-500 pl-2">输入还款方案</h3>
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                        <span className="text-gray-600 text-sm whitespace-nowrap">每年12月还</span>
                        <input 
                            type="number" 
                            value={prepayAmount}
                            onChange={(e) => setPrepayAmount(e.target.value)}
                            placeholder="输入金额"
                            className="flex-1 min-w-0 bg-transparent text-right outline-none font-medium text-gray-900"
                        />
                        <span className="text-gray-600 text-sm whitespace-nowrap">万元</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 mb-4 text-center">
                        方式：减少月供，还款期限不变
                    </div>
                    <button 
                        onClick={handleCalculate}
                        className="w-full bg-red-500 text-white text-sm font-bold py-3 rounded-lg active:bg-red-600 transition-colors"
                    >
                        开始计算
                    </button>
                </div>

                {/* Result Display */}
                {resultData && (
                    <div className="animate-in slide-in-from-bottom duration-300">
                        <div className="bg-red-50 rounded-xl p-6 mb-6 text-center shadow-inner border border-red-100">
                            <div className="text-sm text-gray-500 mb-2">节省利息总额</div>
                            <div className="text-4xl font-bold text-red-600">{fmtWan(resultData.savedInterest)}<span className="text-lg text-red-500 ml-1">万</span></div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="grid grid-cols-3 bg-gray-50 p-3 text-xs text-gray-500 font-medium text-center">
                                <div>年份</div>
                                <div>年末剩余本金</div>
                                <div>下一年月供</div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {resultData.schedule.map((item: any) => {
                                    if (item.remainingPrincipal === 0 && item.nextYearMonthlyPayment === 0) {
                                        if (item.year > 1 && resultData.schedule[item.year-2].remainingPrincipal === 0) return null;
                                    }
                                    return (
                                        <div key={item.year} className="grid grid-cols-3 p-3 text-sm text-center items-center">
                                            <div className="text-gray-900 font-medium">第{item.year}年</div>
                                            <div className="text-gray-600">{fmtWan(item.remainingPrincipal)}万</div>
                                            <div className="text-red-500 font-medium">{item.nextYearMonthlyPayment > 0 ? fmt(item.nextYearMonthlyPayment) : '-'}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};