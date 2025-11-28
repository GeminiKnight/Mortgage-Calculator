import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoanData } from '../context/LoanContext';
import { RepaymentMethod } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Sparkles, Calculator } from 'lucide-react';

export const Result: React.FC = () => {
  const navigate = useNavigate();
  const { params, result } = useLoanData();
  const [method, setMethod] = useState<RepaymentMethod>(RepaymentMethod.EQUAL_INTEREST);
  const [showAllRows, setShowAllRows] = useState(false);

  // If no data, redirect to home
  useEffect(() => {
    if (!params || !result) {
      navigate('/');
    }
  }, [params, result, navigate]);

  if (!params || !result) return null;

  const currentResult = result[method];
  
  // Format currency
  const fmt = (num: number) => Math.round(num).toLocaleString('en-US');
  const fmtWan = (num: number) => (num / 10000).toFixed(2);

  const dataForChart = [
    { name: '贷款总额', value: currentResult.loanAmount, color: '#3b82f6' }, // blue-500
    { name: '利息总额', value: currentResult.totalInterest, color: '#ef4444' }, // red-500
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-10 sticky top-0">
          <button onClick={() => navigate('/')} className="text-gray-500 flex items-center text-sm font-medium">
             &lt; 重新计算
          </button>
          <div className="font-bold text-gray-800">计算结果</div>
          <div className="w-16"></div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white mb-4 shadow-sm">
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

      <div className="px-4 space-y-4 pb-8">
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

        {/* Buttons for AI and Prepayment */}
        <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => navigate('/ai-analysis', { state: { method } })}
                className="py-3 bg-white border border-purple-200 rounded-xl shadow-sm flex flex-col items-center justify-center space-y-1 active:bg-purple-50 transition-colors group"
             >
                 <div className="bg-purple-100 p-1.5 rounded-full group-hover:bg-purple-200 transition-colors">
                     <Sparkles className="w-5 h-5 text-purple-600" />
                 </div>
                 <span className="text-purple-700 font-bold text-xs">AI 智能分析</span>
             </button>
             <button 
                onClick={() => navigate('/prepayment', { state: { method } })}
                className="py-3 bg-white border border-red-200 rounded-xl shadow-sm flex flex-col items-center justify-center space-y-1 active:bg-red-50 transition-colors group"
             >
                 <div className="bg-red-100 p-1.5 rounded-full group-hover:bg-red-200 transition-colors">
                     <Calculator className="w-5 h-5 text-red-600" />
                 </div>
                 <span className="text-red-700 font-bold text-xs">提前还款计算</span>
             </button>
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
      </div>

       {/* Action Buttons Footer */}
       <div className="p-4 grid grid-cols-2 gap-4 bg-white border-t border-gray-100 mt-auto sticky bottom-0">
          <button className="py-3 rounded-lg bg-red-50 text-red-500 font-medium text-sm">
              保存结果
          </button>
            <button className="py-3 rounded-lg bg-red-50 text-red-500 font-medium text-sm">
              历史记录
          </button>
        </div>
    </div>
  );
};