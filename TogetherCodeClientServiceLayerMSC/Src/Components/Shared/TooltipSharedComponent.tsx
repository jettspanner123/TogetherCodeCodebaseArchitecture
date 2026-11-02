import React, { useState } from 'react';

export interface TooltipSharedComponentProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function TooltipSharedComponent({
  content,
  children,
  position = 'top',
}: TooltipSharedComponentProps): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-[11px] font-medium text-neutral-200 bg-neutral-900 border border-neutral-700 rounded shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-150 ${positionStyles[position]}`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}
