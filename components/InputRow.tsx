import React from 'react';
import { ChevronRight } from 'lucide-react';

interface InputRowProps {
  label: string;
  children: React.ReactNode;
  suffix?: string | React.ReactNode;
  isSelect?: boolean;
}

export const InputRow: React.FC<InputRowProps> = ({ label, children, suffix, isSelect }) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <label className="text-gray-700 text-base font-medium min-w-[100px] shrink-0">{label}</label>
      <div className="flex items-center flex-1 justify-end min-w-0 overflow-hidden">
        <div className="flex items-center justify-end flex-nowrap w-full">
            {children}
            {suffix && <span className="ml-2 text-gray-500 text-sm whitespace-nowrap shrink-0">{suffix}</span>}
            {isSelect && <ChevronRight className="w-5 h-5 text-gray-300 ml-1 shrink-0" />}
        </div>
      </div>
    </div>
  );
};