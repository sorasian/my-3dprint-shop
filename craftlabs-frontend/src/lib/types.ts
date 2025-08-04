// src/lib/types.ts

export interface PrintOptions {
  material: string;
  color: string;
  infill: number;
  layer_height: number;
  scale: number;
}

export interface PrintFile {
  id: string; // Unique ID for each file
  file: File;
  fileUrl: string;
  options: PrintOptions;
  dimensions?: { x: number; y: number; z: number };
}

export interface EstimationResultItem {
  filename: string;
  weight: number;
  price: number;
  options: PrintOptions;
}

export interface QuotationData {
  items: EstimationResultItem[];
  total_weight: number;
  total_price: number;
}