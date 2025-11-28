import React, { useState, useEffect } from 'react';

interface RateOption {
  value: number;
  label: string;
}

interface RateSheetProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (rate: string, label: string) => void;
  options: RateOption[];
  initialValue: string;
}

export const RateSheet: React.FC<RateSheetProps> = ({ isOpen, title, onClose, onConfirm, options, initialValue }) => {
  const [selectedRate, setSelectedRate] = useState(initialValue);
  const [customRate, setCustomRate] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (isOpen) {
        // Check if initial value matches a preset
        const match = options.find(o => o.value.toString() === initialValue);
        if (match) {
            setSelectedRate(initialValue);
            setIsCustom(false);
            setCustomRate('');
        } else {
            // Assume it's custom if it has a value but doesn't match presets
            // If it's empty, default to first option
            if (initialValue) {
                setIsCustom(true);
                setCustomRate(initialValue);
                setSelectedRate('');
            } else {
                setIsCustom(false);
                setSelectedRate(options[0]?.value.toString() || '');
            }
        }
    }
  }, [isOpen, initialValue, options]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isCustom) {
        if (!customRate) return;
        onConfirm(customRate, '(自定义利率)');
    } else {
        const opt = options.find(o => o.value.toString() === selectedRate);
        if (opt) onConfirm(opt.value.toString(), `(${opt.label})`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md rounded-t-xl z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white rounded-t-xl sticky top-0 z-20">
            <button onClick={onClose} className="text-gray-500 text-base px-2">取消</button>
            <div className="font-bold text-gray-800 text-lg">{title}</div>
            <button onClick={handleConfirm} className="text-red-600 font-bold text-base px-2">确认</button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-3 pb-8">
            <div 
                onClick={() => setIsCustom(true)}
                className={`p-4 rounded-xl border transition-all flex justify-between items-center cursor-pointer ${isCustom ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'}`}
            >
                <span className={`font-medium ${isCustom ? 'text-red-700' : 'text-gray-700'}`}>手动输入</span>
                {isCustom ? (
                    <div className="flex items-center" onClick={e => e.stopPropagation()}>
                        <input 
                            type="number" 
                            value={customRate}
                            onChange={e => setCustomRate(e.target.value)}
                            className="w-24 text-right bg-white px-2 py-1 rounded border border-red-200 outline-none text-red-600 font-bold text-lg focus:ring-2 focus:ring-red-200"
                            placeholder="0.00"
                            autoFocus
                        />
                        <span className="ml-2 text-red-500 font-bold">%</span>
                    </div>
                ) : (
                   <span className="text-gray-400">请输入</span>
                )}
            </div>

            {options.map(opt => (
                <div 
                    key={opt.value}
                    onClick={() => {
                        setSelectedRate(opt.value.toString());
                        setIsCustom(false);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center ${!isCustom && selectedRate === opt.value.toString() ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'}`}
                >
                    <div className={`text-xl font-bold ${!isCustom && selectedRate === opt.value.toString() ? 'text-red-600' : 'text-gray-800'}`}>
                        {opt.value}%
                    </div>
                    <div className={`text-xs mt-1 ${!isCustom && selectedRate === opt.value.toString() ? 'text-red-400' : 'text-gray-500'}`}>
                        {opt.label}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};