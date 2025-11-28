import React, { useState } from 'react';
import { RepaymentMethod, LoanResultDetail, LoanParams } from '../types';
import { calculatePrepayment } from '../utils/calculator';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronLeft, Sparkles, X, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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

  // AI Analysis States
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiInputs, setAIInputs] = useState({ income: '', pfMonthly: '', pfBalance: '' });
  const [aiResult, setAIResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const handleAIAnalyze = async () => {
      if (!aiInputs.income || !aiInputs.pfMonthly || !aiInputs.pfBalance) {
          alert("请填写完整的财务信息");
          return;
      }

      setIsAnalyzing(true);
      setAIResult('');

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const prompt = `
            作为一名专业的金融顾问，请根据以下房贷和家庭财务数据进行分析：

            【房贷信息】
            - 贷款总额：${fmtWan(currentResult.loanAmount)}万元
            - 贷款年限：${currentResult.years}年
            - 每月应还：${fmt(currentResult.monthlyPayment)}元
            - 贷款类型：${params.loanType === 'COMMERCIAL' ? '商业贷款' : params.loanType === 'PROVIDENT' ? '公积金贷款' : '组合贷款'}
            - 还款方式：${method === RepaymentMethod.EQUAL_INTEREST ? '等额本息' : '等额本金'}

            【家庭财务】
            - 家庭月收入：${aiInputs.income}元
            - 月公积金缴纳：${aiInputs.pfMonthly}元
            - 公积金余额：${aiInputs.pfBalance}万元

            请从以下维度进行分析并给出建议（请使用中文，格式清晰，语气专业且贴心）：
            1. **还款压力评估**：计算家庭收入+公积金对月供的覆盖情况，评估压力等级。
            2. **公积金支撑能力**：当前的公积金余额加上每月缴纳，能支持多久的月供，或者每月能抵扣多少。
            3. **风险提示**：考虑可能的失业风险或利率波动（如果是LPR）对生活质量的影响。
            4. **财务规划建议**：给出具体的建议，如是否需要提前还款、预留多少应急资金等。
          `;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });

          setAIResult(response.text || "分析未能生成，请重试。");
      } catch (error) {
          console.error("AI Analysis Error:", error);
          setAIResult("AI分析服务暂时不可用，请检查网络或稍后再试。");
      } finally {
          setIsAnalyzing(false);
      }
  };

  // Render AI Modal
  const renderAIModal = () => {
      if (!showAIModal) return null;
      return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAIModal(false)}></div>
              <div className="bg-white w-full sm:max-w-lg rounded-t-xl sm:rounded-xl z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl z-20">
                      <div className="flex items-center space-x-2">
                          <Sparkles className="w-5 h-5 text-purple-600 fill-purple-100" />
                          <h2 className="text-lg font-bold text-gray-800">AI 还款压力分析</h2>
                      </div>
                      <button onClick={() => setShowAIModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                          <X className="w-6 h-6 text-gray-500" />
                      </button>
                  </div>
                  
                  <div className="p-5 overflow-y-auto">
                      {!aiResult && !isAnalyzing && (
                          <div className="space-y-4">
                              <p className="text-sm text-gray-500 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                  请输入您的家庭财务状况，AI 将结合当前的房贷计算结果，为您提供个性化的还款压力分析和财务建议。
                              </p>
                              
                              <div className="space-y-3">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">家庭月收入 (元)</label>
                                      <input 
                                          type="number" 
                                          value={aiInputs.income}
                                          onChange={e => setAIInputs({...aiInputs, income: e.target.value})}
                                          className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                          placeholder="例如：20000"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">月公积金缴纳总额 (元)</label>
                                      <input 
                                          type="number" 
                                          value={aiInputs.pfMonthly}
                                          onChange={e => setAIInputs({...aiInputs, pfMonthly: e.target.value})}
                                          className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                          placeholder="个人+公司缴纳总和"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">公积金账户余额 (万元)</label>
                                      <input 
                                          type="number" 
                                          value={aiInputs.pfBalance}
                                          onChange={e => setAIInputs({...aiInputs, pfBalance: e.target.value})}
                                          className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                          placeholder="例如：10.5"
                                      />
                                  </div>
                              </div>

                              <button 
                                  onClick={handleAIAnalyze}
                                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center"
                              >
                                  <Sparkles className="w-5 h-5 mr-2" />
                                  开始智能分析
                              </button>
                          </div>
                      )}

                      {isAnalyzing && (
                          <div className="flex flex-col items-center justify-center py-12 space-y-4">
                              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                              <p className="text-gray-600 font-medium">AI 正在分析您的财务状况...</p>
                          </div>
                      )}

                      {aiResult && (
                          <div className="animate-in fade-in duration-500">
                              <div className="prose prose-purple prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
                                  {aiResult}
                              </div>
                              <button 
                                  onClick={() => setAIResult('')}
                                  className="mt-6 w-full py-3 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                  重新分析
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
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
    <div className="bg-gray-50 pb-4 relative">
      {renderAIModal()}
      
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

        {/* AI Analysis Button */}
        <button 
          onClick={() => setShowAIModal(true)}
          className="w-full py-3 bg-white border border-purple-200 rounded-xl shadow-sm flex items-center justify-center space-x-2 active:bg-purple-50 transition-colors group"
        >
            <div className="bg-purple-100 p-1.5 rounded-full group-hover:bg-purple-200 transition-colors">
                <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-gray-800 font-bold text-sm">AI 分析还款压力与规划建议</span>
        </button>

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