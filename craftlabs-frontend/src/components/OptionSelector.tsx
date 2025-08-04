// src/components/OptionSelector.tsx

"use client";
import React from 'react';

interface Option {
  value: string | number;
  label: string;
  description: string;
}

interface OptionSelectorProps {
  options: Option[];
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ options, selectedValue, onSelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`p-3 rounded-lg border-2 text-left transition-all duration-200 
            ${selectedValue === option.value
              ? 'border-neon-primary bg-bg-glass shadow-neon'
              : 'border-border-light bg-bg-tertiary hover:border-neon-primary/50'
            }`}
        >
          <p className="font-bold text-sm text-text-primary">{option.label}</p>
          <p className="text-xs text-text-secondary mt-1">{option.description}</p>
        </button>
      ))}
    </div>
  );
};

export default OptionSelector;