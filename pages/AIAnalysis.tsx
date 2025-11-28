import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoanData } from '../context/LoanContext';
import { RepaymentMethod } from '../types';
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const AIAnalysis: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { params, result } = useLoanData();
    const method = (location.state as { method?: RepaymentMethod })?.method || RepaymentMethod.EQUAL_INTEREST;

    const [aiInputs, setAIInputs] = useState({ income: '', pfMonthly: '', pfBalance: '' });
    const [streamResult, setStreamResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // To support scrolling to bottom as content streams
    const resultEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!params || !result) {
            navigate('/');
        }
    }, [params, result, navigate]);

    useEffect(() => {
        if (isAnalyzing && resultEndRef.current) {
            resultEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [streamResult, isAnalyzing]);

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
        setStreamResult(''); // Clear previous result

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
            
            // Highly structured prompt for beautiful Markdown output
            const prompt = `
            角色设定：你是一位拥有15年经验的资深金融理财规划师。请根据以下数据，为用户提供一份视觉美观、逻辑清晰、排版专业的房贷压力分析报告。

            【用户数据】
            *   **房贷月供**：${fmt(currentResult.monthlyPayment)}元
            *   **贷款总额**：${fmtWan(currentResult.loanAmount)}万元 (${currentResult.years}年)
            *   **家庭月收入**：${aiInputs.income}元
            *   **月公积金缴纳**：${aiInputs.pfMonthly}元
            *   **公积金余额**：${aiInputs.pfBalance}万元

            【输出要求】
            请严格遵守以下Markdown格式要求，不要输出纯文本段落，多使用图表化表达：

            1.  **核心结论卡片**：文章开头请用引用块（>）配合Emoji，用一句话总结压力等级（如：轻松、适中、吃力、极高风险）。
            2.  **收支结构表**：请务必使用Markdown表格对比“每月净支出”情况。
                *   列包含：项目、金额、备注
                *   行包含：房贷月供、公积金抵扣、实际需现金支出、收入占比。
            3.  **压力可视化**：请使用Emoji符号（如 🟩 🟨 🟥）画一个简单的进度条来表示还款压力指数。
            4.  **公积金续航分析**：计算公积金余额仅用于还款能支撑多少个月，用粗体突出数字。
            5.  **专业建议**：
                *   使用列表（- ）给出3条具体建议。
                *   重点建议请使用 **加粗** 标注。

            请保持语气专业、温暖、鼓励，Markdown排版要利用好标题（###）和列表，使其在移动端阅读体验极佳。
            `;

            const response = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            for await (const chunk of response) {
                const c = chunk as GenerateContentResponse;
                const text = c.text; 
                if (text) {
                    setStreamResult(prev => prev + text);
                }
            }

        } catch (error) {
            console.error("AI Analysis Error:", error);
            setStreamResult("> ⚠️ **分析服务暂时不可用**\n\n请检查网络连接或API Key配置，稍后再试。");
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
                    <h2 className="text-lg font-bold text-gray-800">AI 智能分析</h2>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto pb-safe">
                 {/* Inputs Section */}
                 <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 transition-all duration-500 ${streamResult ? 'opacity-80' : 'opacity-100'}`}>
                      <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">家庭月收入 (元)</label>
                                <input 
                                    type="number" 
                                    value={aiInputs.income}
                                    onChange={e => setAIInputs({...aiInputs, income: e.target.value})}
                                    className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all bg-gray-50 focus:bg-white"
                                    placeholder="例如：20000"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">月公积金 (元)</label>
                                    <input 
                                        type="number" 
                                        value={aiInputs.pfMonthly}
                                        onChange={e => setAIInputs({...aiInputs, pfMonthly: e.target.value})}
                                        className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all bg-gray-50 focus:bg-white"
                                        placeholder="缴纳总和"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">公积金余额 (万)</label>
                                    <input 
                                        type="number" 
                                        value={aiInputs.pfBalance}
                                        onChange={e => setAIInputs({...aiInputs, pfBalance: e.target.value})}
                                        className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all bg-gray-50 focus:bg-white"
                                        placeholder="账户余额"
                                    />
                                </div>
                            </div>

                            {!streamResult && (
                                <button 
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 mt-2"
                                >
                                    {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                    {isAnalyzing ? 'AI 正在思考中...' : '开始智能分析'}
                                </button>
                            )}
                      </div>
                 </div>

                 {/* Results Section - Streaming */}
                 {(streamResult || isAnalyzing) && (
                    <div className="bg-white rounded-xl shadow-md border border-red-50 p-6 animate-in slide-in-from-bottom duration-500 mb-6 relative overflow-hidden">
                         {/* Loading indicator while streaming but empty */}
                         {isAnalyzing && !streamResult && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                                <p className="text-gray-400 text-sm animate-pulse">正在生成财务分析报告...</p>
                            </div>
                         )}
                         
                         {/* Markdown Content */}
                         <div className="ai-result-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {streamResult}
                            </ReactMarkdown>
                         </div>

                         {/* Blinking Cursor at the end of stream */}
                         {isAnalyzing && streamResult && (
                             <span className="inline-block w-2 h-4 bg-red-500 ml-1 animate-pulse align-middle"></span>
                         )}

                         {/* Re-analyze Button (shown after finish) */}
                         {!isAnalyzing && streamResult && (
                             <div className="mt-8 pt-6 border-t border-gray-100">
                                <button 
                                    onClick={handleAnalyze}
                                    className="w-full py-3 bg-gray-50 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-sm"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    重新生成分析
                                </button>
                             </div>
                         )}
                         <div ref={resultEndRef} />
                    </div>
                 )}
            </div>
        </div>
    );
};
