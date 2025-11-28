import React, { useState } from 'react';
import { RepaymentMethod, LoanResultDetail, LoanParams } from '../types';
import { calculatePrepayment } from '../utils/calculator';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronLeft } from 'lucide-react';

interface ResultViewProps {
  results: Record<RepaymentMethod, LoanResultDetail>;
  params: LoanParams;
}

export const ResultView: React.FC<ResultViewProps> = ({ results, params }) => {
  const [method, setMethod] = useState<RepaymentMethod>(RepaymentMethod.EQUAL_INTEREST);
  const [showAllRows, setShowAllRows] = useState(false);
  
  // Prepayment States
  const [prepayAmount, setPrepayAmount] = useState('');
  const [showPrepayResult, setShowPrepayResult] = useState(false);
  const [prepayResultData, setPrepayResultData] = useState<any>(null);

  const currentResult = results[method];
  
  // Format currency
  const fmt = (num: number) => Math.round(num).toLocaleString('en-US');
  const fmtWan = (num: number) => (num / 10000).toFixed(2);

  const dataForChart = [
    { name: '贷款总额', value: currentResult.loanAmount, color: '#3b82f6' }, // blue-500
    { name: '利息总额', value: currentResult.totalInterest, color: '#ef4444' }, // red-500
  ];

  const handlePrepayCalculate = () => {
    if (!prepayAmount || Number(prepayAmount) <= 0) {
        alert('请输入有效的提前还款金额');
        return;
    }
    const result = calculatePrepayment(params, method, Number(prepayAmount) * 10000);
    setPrepayResultData(result);
    setShowPrepayResult(true);
  };

  if (showPrepayResult && prepayResultData) {
      return (
          <div className="bg-white fixed inset-0 z-50 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex items-center p-4 border-b border-gray-100 bg-white shadow-sm">
                  <button onClick={() => setShowPrepayResult(false)} className="mr-2">
                      <ChevronLeft className="w-6 h-6 text-gray-600" />
                  </button>
                  <h2 className="text-lg font-bold text-gray-800">提前还款结果</h2>
              </div>
              
              <div className="p-4 flex-1 overflow-auto">
                   {/* Summary Card */}
                   <div className="bg-red-50 rounded-xl p-6 mb-6 text-center shadow-inner">
                        <div className="text-sm text-gray-500 mb-2">节省利息总额</div>
                        <div className="text-4xl font-bold text-red-600">{fmtWan(prepayResultData.savedInterest)}<span className="text-lg text-red-500 ml-1">万</span></div>
                        <div className="text-xs text-gray-400 mt-2 px-4">
                            方案：每年12月提前还款 {prepayAmount} 万元，减少月供，还款期限不变
                        </div>
                   </div>

                   {/* Schedule */}
                   <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="grid grid-cols-3 bg-gray-50 p-3 text-xs text-gray-500 font-medium text-center">
                            <div>年份</div>
                            <div>年末剩余本金</div>
                            <div>下一年月供</div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {prepayResultData.schedule.map((item: any) => {
                                // Filter out years after loan is paid off if previous year was also 0
                                if (item.remainingPrincipal === 0 && item.nextYearMonthlyPayment === 0) {
                                    if (item.year > 1 && prepayResultData.schedule[item.year-2].remainingPrincipal === 0) return null;
                                }
                                return (
                                <div key={item.year} className="grid grid-cols-3 p-3 text-sm text-center items-center">
                                    <div className="text-gray-900 font-medium">第{item.year}年</div>
                                    <div className="text-gray-600">{fmtWan(item.remainingPrincipal)}万</div>
                                    <div className="text-red-500 font-medium">{item.nextYearMonthlyPayment > 0 ? fmt(item.nextYearMonthlyPayment) : '-'}</div>
                                </div>
                            )})}
                        </div>
                   </div>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-gray-50 pb-4">
      {/* Tabs for Result Type */}
      <div className="flex bg-white mb-4 shadow-sm sticky top-0 z-10">
        <button
          onClick={() => setMethod(RepaymentMethod.EQUAL_INTEREST)}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
            method === RepaymentMethod.EQUAL_INTEREST
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-gray-500'
          }`}
        >
          <div>等额本息</div>
          <div className="text-xs font-normal opacity-80 mt-1">每月还款总额不变</div>
        </button>
        <button
          onClick={() => setMethod(RepaymentMethod.EQUAL_PRINCIPAL)}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
            method === RepaymentMethod.EQUAL_PRINCIPAL
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-gray-500'
          }`}
        >
          <div>等额本金</div>
          <div className="text-xs font-normal opacity-80 mt-1">首月应还{fmt(currentResult.monthlyPayment)}元</div>
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Main Result Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6h6v-6h-6z"></path></svg>
          </div>
          
          <div className="text-sm opacity-90 mb-1">
            {method === RepaymentMethod.EQUAL_INTEREST ? '每个月应还' : '首月应还'}
          </div>
          <div className="text-4xl font-bold mb-2">
            {fmt(currentResult.monthlyPayment)}<span className="text-lg font-normal ml-1">元</span>
          </div>
          
          <div className="text-xs opacity-80 mb-0">
             {method === RepaymentMethod.EQUAL_INTEREST 
               ? '每月还款金额不变，其中还款的本金逐月递增，利息逐月递减。' 
               : `每月还款递减${fmt(currentResult.monthlyDecrease || 0)}元，本金不变，利息递减。`}
          </div>
        </div>

        {/* Breakdown Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-4">还款总额构成</h3>
          
          <div className="flex items-center justify-between mb-6">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{fmtWan(currentResult.totalPayment)}万</div>
              <div className="text-xs text-gray-500">还款总额</div>
            </div>
            <div className="text-gray-300">=</div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{fmtWan(currentResult.loanAmount)}万</div>
              <div className="text-xs text-gray-500">贷款总额</div>
            </div>
            <div className="text-gray-300">+</div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{fmtWan(currentResult.totalInterest)}万</div>
              <div className="text-xs text-gray-500">利息总额</div>
            </div>
            <div className="w-px h-8 bg-gray-200 mx-2"></div>
             <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{currentResult.years}年</div>
              <div className="text-xs text-gray-500">贷款年限</div>
            </div>
          </div>

          {/* Visual Bar */}
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                    data={dataForChart}
                    innerRadius={0}
                    outerRadius={25}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dataForChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                     verticalAlign="middle" 
                     align="right"
                     layout="vertical"
                     iconType="circle"
                     formatter={(value, entry: any) => <span className="text-xs text-gray-600 ml-1">{value} ({((entry.payload.value / currentResult.totalPayment) * 100).toFixed(1)}%)</span>}
                  />
                  <Tooltip formatter={(value: number) => `${fmtWan(value)}万`} />
                </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-4 bg-gray-50 p-3 text-xs text-gray-500 font-medium text-center">
            <div>期数</div>
            <div>月供总额</div>
            <div>月供本金</div>
            <div>月供利息</div>
          </div>
          <div className="divide-y divide-gray-100">
            {(showAllRows ? currentResult.schedule : currentResult.schedule.slice(0, 5)).map((item) => (
              <div key={item.month} className="grid grid-cols-4 p-3 text-xs text-center items-center hover:bg-red-50 transition-colors">
                <div className="text-gray-500">{item.month}</div>
                <div className="font-bold text-gray-800">{fmt(item.payment)}</div>
                <div className="text-gray-600">{fmt(item.principal)}</div>
                <div className="text-gray-600">{fmt(item.interest)}</div>
              </div>
            ))}
          </div>
          
          {!showAllRows && (
            <button 
              onClick={() => setShowAllRows(true)}
              className="w-full py-4 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 font-medium transition-colors"
            >
              查看更多
            </button>
          )}
          {showAllRows && (
            <button 
              onClick={() => setShowAllRows(false)}
              className="w-full py-4 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 font-medium transition-colors"
            >
              收起列表
            </button>
          )}
        </div>

        {/* Prepayment Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
             <h3 className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-red-500 pl-2">提前还款计算</h3>
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
             <button 
                onClick={handlePrepayCalculate}
                className="w-full mt-3 bg-red-500 text-white text-sm font-bold py-2.5 rounded-lg active:bg-red-600 transition-colors"
             >
                计算提前还款
             </button>
             <div className="text-xs text-gray-400 mt-2 text-center">
                 方式：减少月供，还款期限不变
             </div>
        </div>

      </div>
    </div>
  );
};