
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface MonthSelectorProps {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedMonth, setSelectedMonth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedMonth.getFullYear());
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset view year if selected month changes externally
    setViewYear(selectedMonth.getFullYear());
  }, [selectedMonth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(new Date(viewYear, monthIndex, 1));
    setIsOpen(false);
  };

  const formattedMonth = selectedMonth.toLocaleString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  
  const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('pt-BR', { month: 'short' }));
  const today = new Date();

  return (
    <div ref={selectorRef} className="relative w-full md:w-auto">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-gray-800 p-3 rounded-lg border border-gray-700 hover:brightness-110 transition-all"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="font-bold text-lg text-white capitalize w-48 text-center">{formattedMonth}</span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-4 z-10 animate-fade-in-down">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setViewYear(y => y - 1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <ChevronLeftIcon className="w-5 h-5 text-gray-300"/>
            </button>
            <span className="font-bold text-white text-lg">{viewYear}</span>
            <button 
                onClick={() => setViewYear(y => y + 1)} 
                disabled={viewYear >= today.getFullYear()}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronRightIcon className="w-5 h-5 text-gray-300"/>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => {
              const isSelected = selectedMonth.getFullYear() === viewYear && selectedMonth.getMonth() === index;
              const isFuture = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && index > today.getMonth());
              
              return (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(index)}
                  disabled={isFuture}
                  className={`p-3 text-sm rounded-md transition-colors
                    ${isSelected ? 'bg-amber-600 text-white font-bold' : 'text-gray-200 hover:bg-gray-700'}
                    ${isFuture ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {month.charAt(0).toUpperCase() + month.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthSelector;
