// src/components/ColorSelector.tsx

"use client";
import React from 'react';

interface ColorOption {
  name: string;
  hex: string;
}

interface ColorSelectorProps {
  options: ColorOption[];
  selectedValue: string;
  onSelect: (name: string) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ options, selectedValue, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((color) => (
        <button
          key={color.name}
          title={color.name}
          onClick={() => onSelect(color.name)}
          className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110
            ${selectedValue === color.name
              ? 'border-neon-primary scale-110 shadow-neon'
              : 'border-transparent'
            }`}
        >
          <div
            className="w-full h-full rounded-full"
            style={{ backgroundColor: color.hex }}
          />
        </button>
      ))}
    </div>
  );
};

export default ColorSelector;