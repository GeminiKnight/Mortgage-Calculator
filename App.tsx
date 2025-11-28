import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoanProvider } from './context/LoanContext';
import { Home } from './pages/Home';
import { Result } from './pages/Result';
import { Prepayment } from './pages/Prepayment';
import { AIAnalysis } from './pages/AIAnalysis';

const App: React.FC = () => {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 shadow-2xl overflow-hidden">
      <LoanProvider>
        <HashRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/result" element={<Result />} />
                <Route path="/prepayment" element={<Prepayment />} />
                <Route path="/ai-analysis" element={<AIAnalysis />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
      </LoanProvider>
    </div>
  );
};

export default App;