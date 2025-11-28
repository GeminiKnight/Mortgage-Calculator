import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoanData } from '../context/LoanContext';
import { RepaymentMethod } from '../types';
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const AIAnalysis: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { params, result } = useLoanData();
    const method = (location.state as { method?: RepaymentMethod })?.method || RepaymentMethod.EQUAL_INTEREST;

    const [aiInputs, setAIInputs] = useState({ income: '', pfMonthly: '', pfBalance: '' });
    const [aiResult, setAIResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (!params || !result) {
            navigate('/');
        }
    }, [params, result, navigate]);

    if (!params || !result) return null;

    const currentResult = result[method];
    const fmt = (num: number) => Math.round(num).toLocaleString('en-US');
    const fmtWan = (num: number) => (num / 10000).toFixed(2);

    const handleAnalyze = async () => {
        if (!aiInputs.income || !aiInputs.pfMonthly || !aiInputs.pfBalance) {
            alert("请填写完整的财务信息");
            return;
        }

        setIsAnalyzing(true);
        setAIResult('');

        try {
            // Use import.meta.env.VITE_API_KEY as configured in vite.config.ts
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
            
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

            请从以下维度进行分析并给出建议（请使用中文，格式清晰，合理使用图文表格，确保回答结果展示美观，可读性高，语气专业且贴心）：
            1. **还款压力评估**：计算家庭收入+公积金对月供的覆盖情况，评估压力等级。
            2. **公积金支撑能力**：当前的公积金余额加上每月缴纳，能支持多久的月供，或者每月能抵扣多少。
            3. **风险提示**：考虑可能的失业风险或利率波动（如果是LPR）对生活质量的影响。
            4. **财务规划建议**：给出具体的建议，如是否需要提前还款、预留多少应急资金等。
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            // Use .text property directly
            setAIResult(response.text || "分析未能生成，请重试。");
        } catch (error) {
            console.error("AI Analysis Error:", error);
            setAIResult("AI分析服务暂时不可用，请检查网络或稍后再试。");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex items-center p-4 border-b border-gray-100 bg-white shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="mr-2">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-red-500" />
                    <h2 className="text-lg font-bold text-gray-800">智能分析</h2>
                </div>
            </div>

            <div className="p-4 flex-1">
                 {/* Inputs */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                      <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">家庭月收入 (元)</label>
                                <input 
                                    type="number" 
                                    value={aiInputs.income}
                                    onChange={e => setAIInputs({...aiInputs, income: e.target.value})}
                                    className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                    placeholder="例如：20000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">月公积金缴纳总额 (元)</label>
                                <input 
                                    type="number" 
                                    value={aiInputs.pfMonthly}
                                    onChange={e => setAIInputs({...aiInputs, pfMonthly: e.target.value})}
                                    className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                    placeholder="个人+公司缴纳总和"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">公积金账户余额 (万元)</label>
                                <input 
                                    type="number" 
                                    value={aiInputs.pfBalance}
                                    onChange={e => setAIInputs({...aiInputs, pfBalance: e.target.value})}
                                    className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                    placeholder="例如：10.5"
                                />
                            </div>

                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70"
                            >
                                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                {isAnalyzing ? '正在分析...' : '开始智能分析'}
                            </button>
                      </div>
                 </div>

                 {/* Results */}
                 {aiResult && (
                    <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 animate-in fade-in duration-500">
                         <div className="prose prose-red prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {aiResult}
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};