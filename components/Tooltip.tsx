import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                      transition-opacity duration-300 z-10">
        <span className="bg-black text-white text-xs font-semibold rounded-md shadow-lg px-2 py-1">
          {text}
        </span>
      </div>
    </div>
  );
};

export default Tooltip;
