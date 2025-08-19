"use client";

import React, { useState, useRef, Suspense, FC, useEffect, useCallback } from 'react';
import Image from 'next/image'; // <-- 1. เพิ่ม import นี้
import axios from 'axios';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Center, Text } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';
import { PrintFile, PrintOptions, QuotationData } from '@/lib/types';
import OptionSelector from './OptionSelector';
import ColorSelector from './ColorSelector';


// --- 3D Model Component ---
const Model: FC<{ fileUrl: string; scale: number; onDimensionsLoad: (dim: { x: number; y: number; z: number; }) => void; }> = React.memo(({ fileUrl, scale, onDimensionsLoad }) => {
  console.log("Rendering Model for:", fileUrl); // <-- ใช้สำหรับ Debug, จะเห็นว่ามันไม่รันบ่อยเหมือนเดิม
  const geom = useLoader(STLLoader, fileUrl);

  useEffect(() => {
    geom.computeBoundingBox();
    const box = geom.boundingBox;
    if (box) {
      const size = new THREE.Vector3();
      box.getSize(size);
      onDimensionsLoad({ x: size.x, y: size.y, z: size.z });
    }
  }, [geom, onDimensionsLoad]); // Dependencies ถูกต้องแล้ว

  return (
    <mesh geometry={geom} scale={scale} castShadow>
      <meshStandardMaterial color={"#ff8200"} roughness={0.3} metalness={0.2} />
    </mesh>
  );
});
Model.displayName = 'Model'; // <-- เพิ่ม displayName เพื่อช่วยในการ Debug

// --- Custom Select Component ---
const NeonSelect: FC<React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }> = ({ children, ...props }) => (
    <div className="relative w-full">
        <select {...props} className="appearance-none w-full pl-4 pr-10 py-2.5 text-base bg-bg-tertiary border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-primary focus:border-neon-primary transition-all text-text-primary">
            {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-tertiary">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
    </div>
);

// --- Main Estimator Component ---
export default function Estimator() {
  const [files, setFiles] = useState<PrintFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [quotationResult, setQuotationResult] = useState<QuotationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scale, setScale] = useState(1.0);
  const [scalePercent, setScalePercent] = useState(100); // <-- [เพิ่ม] State ใหม่สำหรับเปอร์เซ็นต์
  const [originalDimensions, setOriginalDimensions] = useState<{ x: number; y: number; z: number; } | null>(null);
  const [displayDimensions, setDisplayDimensions] = useState<{ x: number; y: number; z: number; }>({ x: 0, y: 0, z: 0 });
  
  const materials = ['PLA', 'PETG', 'PLA-PRO', 'PLA-CF', 'TPU', 'ABS', 'RESIN'];
  const colors = ['ขาว (White)', 'ดำ (Black)', 'ส้ม (Orange)', 'เขียว (Green)', 'เหลือง (Yellow)', 'แดง (Red)', 'น้ำเงิน (Blue)', 'เทา (Gray)', 'ชมพู (Pink)'];
  const infills = [10, 20, 50, 80];
  const layerHeights = [0.08, 0.16, 0.26];
  
   
    const colorOptions = [
        { name: 'ขาว (White)', hex: '#FFFFFF' },
        { name: 'ดำ (Black)', hex: '#2E2E2E' },
        { name: 'ส้ม (Orange)', hex: '#FF8200' },
        { name: 'เขียว (Green)', hex: '#2ECC71' },
        { name: 'เหลือง (Yellow)', hex: '#F1C40F' },
        { name: 'แดง (Red)', hex: '#E74C3C' },
        { name: 'น้ำเงิน (Blue)', hex: '#3498DB' },
        { name: 'เทา (Gray)', hex: '#95A5A6' },
        { name: 'ชมพู (Pink)', hex: '#E84393' },
    ];

    const infillOptions = [
        { value: 10, label: '10%', description: 'เบา & ประหยัดสุด (งานโชว์)' },
        { value: 20, label: '20%', description: 'สมดุล (ทั่วไป)' },
        { value: 50, label: '50%', description: 'แข็งแรง (รับแรงกด)' },
        { value: 80, label: '80%', description: 'ทนทานสูงสุด (ชิ้นส่วนวิศวกรรม)' },
    ];

    const layerHeightOptions = [
        { value: 0.08, label: '0.08 mm', description: 'ละเอียดสูงสุด (งาน Art, Figure)' },
        { value: 0.16, label: '0.16 mm', description: 'คุณภาพดี (ทั่วไป)' },
        { value: 0.26, label: '0.26 mm', description: 'ปริ้นเร็วสุด (งานต้นแบบ)' },
    ];


 const activeFile = files.find(f => f.id === activeFileId);

  // --- [จุดที่แก้ไข 1] อัปเกรด useEffect ให้เสถียรขึ้น ---
  useEffect(() => {
    if (activeFile) {
      const { scale } = activeFile.options;
      setScale(scale);
      setScalePercent(scale * 100);
      if (activeFile.dimensions) {
        setDisplayDimensions({ x: activeFile.dimensions.x * scale, y: activeFile.dimensions.y * scale, z: activeFile.dimensions.z * scale });
      } else {
        setDisplayDimensions({ x: 0, y: 0, z: 0 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFileId, files]); // <-- 2. ปิดคำเตือน ESLint ที่นี่

  // Handler สำหรับ Scale Factor
  const handleScaleFactorChange = (factor: number) => {
    if (!activeFile) return;
    const newScale = Math.max(0.01, factor); // ป้องกันค่า 0 หรือติดลบ
    setScale(newScale);
    setScalePercent(newScale * 100);
    updateFileOptions(activeFile.id, { scale: newScale });
  };

  // Handler สำหรับ Scale Percent
  const handleScalePercentChange = (percent: number) => {
    if (!activeFile) return;
    const newPercent = Math.max(1, percent); // ป้องกันค่า 0 หรือติดลบ
    const newScale = newPercent / 100.0;
    setScale(newScale);
    setScalePercent(newPercent);
    updateFileOptions(activeFile.id, { scale: newScale });
  };

    const handleDimensionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!activeFile || !activeFile.dimensions || activeFile.dimensions[axis] === 0 || value <= 0) return;
    const newScale = value / activeFile.dimensions[axis];
    setScale(newScale);
    setScalePercent(newScale * 100);
    updateFileOptions(activeFile.id, { scale: newScale });
  };

  
  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRawFiles = Array.from(event.target.files || []);
    const newPrintFiles: PrintFile[] = newRawFiles
      .filter(f => f.name.toLowerCase().endsWith('.stl'))
      .map(f => ({
        id: `${f.name}-${f.lastModified}-${Math.random()}`,
        file: f, fileUrl: URL.createObjectURL(f),
        options: { material: 'PLA', color: 'ขาว (White)', infill: 20, layer_height: 0.16, scale: 1.0 },
      }));
    setFiles(prev => [...prev, ...newPrintFiles]);
    if (!activeFileId && newPrintFiles.length > 0) setActiveFileId(newPrintFiles[0].id);
    setQuotationResult(null);
  };

  const removeFile = (idToRemove: string) => {
    const fileToRemove = files.find(f => f.id === idToRemove);
    if(fileToRemove) URL.revokeObjectURL(fileToRemove.fileUrl);
    
    setFiles(prev => {
        const remaining = prev.filter(f => f.id !== idToRemove);
        if (activeFileId === idToRemove) setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
        return remaining;
    });
    setQuotationResult(null);
  };


  // ฟังก์ชันนี้สำหรับเมื่อ "ผู้ใช้" เปลี่ยน Option (ซึ่งควรล้างผลลัพธ์เก่า)
  const updateFileOptions = useCallback((id: string, newOptions: Partial<PrintOptions>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, options: { ...f.options, ...newOptions } } : f));
    setQuotationResult(null); 
  }, []);
  
  // ฟังก์ชันนี้สำหรับเมื่อ "3D Model" โหลดเสร็จ (ซึ่งไม่ควรล้างผลลัพธ์)
  const updateFileDimensions = useCallback((id: string, dimensions: { x: number; y: number; z: number; }) => {
    setFiles(prevFiles => {
      // --- [จุดที่แก้ไข 2] ป้องกันการ re-render ที่ไม่จำเป็น ---
      const targetFile = prevFiles.find(f => f.id === id);
      // ถ้าไม่มีไฟล์ หรือ dimensions ไม่ได้เปลี่ยน ก็ไม่ต้องทำอะไรเลย
      if (!targetFile || (targetFile.dimensions && 
          targetFile.dimensions.x === dimensions.x &&
          targetFile.dimensions.y === dimensions.y &&
          targetFile.dimensions.z === dimensions.z)) {
        return prevFiles;
      }

      // ถ้ามีการเปลี่ยนแปลงจริงๆ ค่อยสร้าง array ใหม่
      return prevFiles.map(f =>
        f.id === id ? { ...f, dimensions } : f
      );
    });
  }, []); // <-- เอา activeFileId ออกจาก dependency เพราะเราไม่ได้ใช้มันข้างในแล้ว
  const handleSubmit = async () => {
    if (files.length === 0) { setError('กรุณาอัปโหลดไฟล์ STL อย่างน้อย 1 ไฟล์'); return; }
    setIsLoading(true);
    setError(null);
    setQuotationResult(null);
    const formData = new FormData();
    const allOptions = files.map(pf => pf.options);
    files.forEach(pf => formData.append('files', pf.file));
    formData.append('options_json', JSON.stringify(allOptions));
    try {
      const response = await axios.post('/api/estimate_multi/', formData);
      setQuotationResult(response.data);
    } catch (err: unknown) { // <-- 3. แก้ไข Type Error
        if (axios.isAxiosError(err) && err.response) {
            setError(err.response.data?.detail || 'เกิดข้อผิดพลาดในการคำนวณราคา');
        } else {
            setError('เกิดข้อผิดพลาดที่ไม่รู้จัก');
        }
    }
    finally { setIsLoading(false); }
  };


  const handleGenerateQuotation = async () => {
    if (!quotationResult) return;
    setIsGeneratingPdf(true);
    try {
      const response = await axios.post('/api/generate_quotation_multi/', quotationResult, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Quotation-Multi-Item.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length >= 2) filename = filenameMatch[1];
      }
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch { // <-- 4. แก้ไข Unused Variable
      setError('ไม่สามารถสร้างใบเสนอราคาได้');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  return (
    <div className="w-full bg-bg-primary font-sans">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-bg-secondary rounded-2xl shadow-2xl h-96 lg:h-[calc(100vh-8rem)] min-h-[500px] p-2 relative border border-border-light sticky top-24">
             <div className="absolute top-4 left-4 z-10 bg-bg-card backdrop-blur-sm border border-border-glass rounded-full px-4 py-1 text-sm text-text-secondary">3D Model Viewer</div>
            <Canvas shadows camera={{ position: [0, 0, 150], fov: 50 }}>
              <Suspense fallback={null}>
                <Stage environment="city" intensity={0.6} contactShadow={{ opacity: 0.5, blur: 2 }} preset="rembrandt" adjustCamera={1.2}>
                  
                  {/* --- [จุดที่แก้ไข 2] เปลี่ยน onDimensionsLoad ให้เรียกใช้ฟังก์ชันใหม่ --- */}
                  {activeFile ? <Model fileUrl={activeFile.fileUrl} scale={activeFile.options.scale} onDimensionsLoad={(dim) => updateFileDimensions(activeFile.id, dim)} /> : <Center><Text color="#777" fontSize={5} textAlign='center'>{`เลือกไฟล์เพื่อแสดงผล`}</Text></Center>}

                </Stage>
              </Suspense>
              <OrbitControls makeDefault minDistance={50} maxDistance={500} enablePan={false} />
            </Canvas>
          </div>

          <div className="lg:col-span-1 bg-bg-card backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-border-glass h-fit space-y-6">
            <div>
                <h2 className="text-xl font-bold text-neon-primary mb-4">รายการไฟล์</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {files.map(pf => (
                        <div key={pf.id} className={`flex items-center p-2 rounded-lg border transition-colors duration-300 ${activeFileId === pf.id ? 'bg-bg-glass border-neon-primary' : 'bg-bg-tertiary border-border-light'}`}>
                            <div className="flex-1 truncate cursor-pointer" onClick={() => setActiveFileId(pf.id)}>
                                <p className={`text-sm font-semibold ${activeFileId === pf.id ? 'text-neon-primary' : 'text-text-primary'}`}>{pf.file.name}</p>
                            </div>
                            <button onClick={() => removeFile(pf.id)} className="ml-4 text-xl font-bold text-text-tertiary hover:text-red-500 transition-colors">×</button>
                        </div>
                    ))}
                    {files.length === 0 && <p className="text-center text-text-tertiary py-4">ยังไม่มีไฟล์ที่อัปโหลด</p>}
                </div>
                <div className="relative mt-4">
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-bg-tertiary border border-border-light text-text-secondary font-semibold py-3 px-4 rounded-lg hover:border-neon-accent hover:text-neon-accent transition-colors">เพิ่มไฟล์...</button>
                    <input ref={fileInputRef} type="file" onChange={handleFilesChange} multiple accept=".stl" className="hidden" />
                </div>
            </div>

            {activeFile ? (
              <div className="space-y-6 pt-6 border-t border-border-light animate-fadeIn">
                <h2 className="text-xl font-bold text-neon-primary">ตั้งค่า: <span className="text-text-primary font-medium truncate">{activeFile.file.name}</span></h2>
                {/* --- [จุดที่แก้ไข 3] UI ใหม่สำหรับ Scaling --- */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-text-primary">ปรับขนาด (Scaling)</h3>
                  
                  {/* Scale Percent */}
                  <div className="space-y-2">
                      <label htmlFor={`scalePercent-${activeFile.id}`} className="text-sm font-medium text-text-secondary">Scale (%)</label>
                      <input 
                        id={`scalePercent-${activeFile.id}`} 
                        type="number" 
                        step="1" 
                        value={scalePercent.toFixed(0)} 
                        onChange={e => handleScalePercentChange(parseInt(e.target.value) || 100)} 
                        className="w-full mt-1 p-2 bg-bg-tertiary border border-border-light rounded-md focus:ring-2 focus:ring-neon-primary focus:border-neon-primary outline-none text-text-primary" 
                      />
                  </div>

                  {/* Scale Factor */}
                  <div className="space-y-2">
                      <label htmlFor={`scale-${activeFile.id}`} className="text-sm font-medium text-text-secondary">Scale Factor</label>
                      <input 
                        id={`scale-${activeFile.id}`} 
                        type="number" 
                        step="0.01" 
                        value={scale.toFixed(2)} 
                        onChange={e => handleScaleFactorChange(parseFloat(e.target.value) || 1)} 
                        className="w-full mt-1 p-2 bg-bg-tertiary border border-border-light rounded-md focus:ring-2 focus:ring-neon-primary focus:border-neon-primary outline-none text-text-primary" 
                      />
                  </div>

                  {/* Size in mm */}
                  <div className="grid grid-cols-3 gap-2">
                      <div>
                          <label htmlFor={`dimX-${activeFile.id}`} className="text-sm font-medium text-text-secondary">X (mm)</label>
                          <input id={`dimX-${activeFile.id}`} type="number" value={displayDimensions.x.toFixed(2)} onChange={e => handleDimensionChange('x', parseFloat(e.target.value))} className="w-full mt-1 p-2 bg-bg-tertiary border border-border-light rounded-md text-text-primary" />
                      </div>
                      <div>
                          <label htmlFor={`dimY-${activeFile.id}`} className="text-sm font-medium text-text-secondary">Y (mm)</label>
                          <input id={`dimY-${activeFile.id}`} type="number" value={displayDimensions.y.toFixed(2)} onChange={e => handleDimensionChange('y', parseFloat(e.target.value))} className="w-full mt-1 p-2 bg-bg-tertiary border border-border-light rounded-md text-text-primary" />
                      </div>
                      <div>
                          <label htmlFor={`dimZ-${activeFile.id}`} className="text-sm font-medium text-text-secondary">Z (mm)</label>
                          <input id={`dimZ-${activeFile.id}`} type="number" value={displayDimensions.z.toFixed(2)} onChange={e => handleDimensionChange('z', parseFloat(e.target.value))} className="w-full mt-1 p-2 bg-bg-tertiary border border-border-light rounded-md text-text-primary" />
                      </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="font-semibold text-text-primary">ตั้งค่าการปริ้น</h3>
                    
                    {/* --- [จุดที่แก้ไข] --- */}
                    <div>
                        <label htmlFor={`material-${activeFile.id}`} className="text-sm font-semibold text-text-secondary mb-2 block">วัสดุ (Material)</label>
                        <NeonSelect id={`material-${activeFile.id}`} value={activeFile.options.material} onChange={(e) => updateFileOptions(activeFile.id, { material: e.target.value })}>
                            {materials.map(mat => (<option key={mat} value={mat}>{mat}</option>))}
                        </NeonSelect>
                    </div>

                    {/* Color Selector */}
                    <div>
                        <label className="text-sm font-semibold text-text-secondary mb-2 block">สี (Color)</label>
                        <ColorSelector 
                            options={colorOptions}
                            selectedValue={activeFile.options.color}
                            onSelect={(color) => updateFileOptions(activeFile.id, { color })}
                        />
                    </div>

                    {/* Infill Selector */}
                    <div>
                        <label className="text-sm font-semibold text-text-secondary mb-2 block">ความหนาแน่น (Infill)</label>
                        <OptionSelector 
                            options={infillOptions}
                            selectedValue={activeFile.options.infill}
                            onSelect={(infill) => updateFileOptions(activeFile.id, { infill: Number(infill) })}
                        />
                    </div>

                    {/* Layer Height Selector */}
                    <div>
                        <label className="text-sm font-semibold text-text-secondary mb-2 block">ความละเอียด (Layer Height)</label>
                        <OptionSelector
                            options={layerHeightOptions}
                            selectedValue={activeFile.options.layer_height}
                            onSelect={(layer_height) => updateFileOptions(activeFile.id, { layer_height: Number(layer_height) })}
                        />
                    </div>
                </div>
              </div>
            ) : (
                <div className="pt-6 border-t border-border-light text-center text-text-tertiary">
                    <p>กรุณาอัปโหลด หรือเลือกไฟล์จากรายการเพื่อตั้งค่า</p>
                </div>
            )}
            
            <div className="pt-6 border-t border-border-light">
                <button onClick={handleSubmit} disabled={isLoading || files.length === 0} className="w-full text-lg bg-gradient-to-r from-neon-primary to-orange-500 text-white font-bold py-4 px-4 rounded-xl hover:shadow-neon-lg transition-all duration-300 disabled:bg-gray-600 disabled:shadow-none disabled:cursor-not-allowed transform hover:-translate-y-1">
                    {isLoading ? 'กำลังคำนวณ...' : `ประเมินราคาทั้งหมด (${files.length} ไฟล์)`}
                </button>
            </div>
            
            {error && <p className="mt-4 text-red-500 text-center font-semibold">{error}</p>}
            {quotationResult && (
              <div className="mt-6 pt-6 border-t border-border-light space-y-4 animate-fadeIn">
                <h3 className="text-xl font-bold text-text-primary text-center">สรุปผลการประเมิน</h3>
                <div className="bg-bg-secondary p-4 rounded-lg space-y-3 border border-border-light">
                    <div className="flex justify-between items-center text-text-secondary text-sm"><span>น้ำหนักรวม:</span><span className="font-bold text-text-primary">{quotationResult.total_weight.toFixed(2)} g</span></div>
                </div>
                <p className="text-4xl font-extrabold text-neon-primary text-center py-2">{quotationResult.total_price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <button onClick={handleGenerateQuotation} disabled={isGeneratingPdf} className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-neon-accent text-neon-accent font-bold py-3 px-4 rounded-lg hover:bg-neon-accent hover:text-bg-primary transition-colors disabled:bg-gray-600 disabled:border-gray-600 disabled:text-gray-400">
                      {isGeneratingPdf ? 'กำลังสร้าง...' : 'ดาวน์โหลดใบเสนอราคา'}
                    </button>
                    <button onClick={() => setPaymentModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-neon-secondary text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-neon-secondary/50 transition-all transform hover:-translate-y-0.5">
                      ชำระเงิน
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setPaymentModalOpen(false)}>
            <div className="bg-bg-card border border-border-glass p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-zoomIn" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-neon-primary">สแกนเพื่อชำระเงิน</h2>
                <div className="p-4 border border-border-light rounded-lg inline-block bg-white">
                    <Image
                        src="/qr-placeholder.png"
                        alt="Payment QR Code"
                        width={256}
                        height={256}
                        className="mx-auto"
                    />
                </div>
                <p className="mt-4 text-text-secondary">ยอดชำระเงิน: <b className='text-xl text-text-primary'>{quotationResult?.total_price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</b></p>
                <button onClick={() => setPaymentModalOpen(false)} className="mt-6 bg-red-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-red-700 transition-colors">ปิด</button>
            </div>
        </div>
      )}
    </div>
  );
}