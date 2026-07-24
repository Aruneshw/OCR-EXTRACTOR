import { useState, useEffect } from 'react';
import { Upload, FileText, Download, FileArchive, Loader2 } from 'lucide-react';
import { processImage } from './lib/imageProcessor';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setProcessedImages([]);
    }
  };

  const processImages = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const processed = await Promise.all(files.map(file => processImage(file)));
      setProcessedImages(processed);
    } catch (err) {
      console.error('Failed to process images:', err);
      alert('Failed to process images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = () => {
    if (processedImages.length === 0) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    processedImages.forEach((imgData, index) => {
      if (index > 0) doc.addPage();
      
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      
      const img = new Image();
      img.src = imgData;
      
      const ratio = Math.min(pdfWidth / img.width, pdfHeight / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;
      
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;
      
      doc.addImage(imgData, 'PNG', x, y, width, height);
    });
    
    doc.save('restored_notes.pdf');
  };

  const generateZIP = async () => {
    if (processedImages.length === 0) return;
    const zip = new JSZip();
    
    processedImages.forEach((dataUrl, i) => {
      const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
      zip.file(`page_${i + 1}.png`, base64Data, { base64: true });
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'restored_notes_pngs.zip');
  };

  const exportText = async () => {
    if (processedImages.length === 0) return;
    setIsExporting(true);
    try {
      let fullText = "";
      for (const imgBase64 of processedImages) {
         const res = await fetch('/api/extract-text', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ imageBase64: imgBase64 })
         });
         
         if (!res.ok) throw new Error('Failed to extract text via Gemini');
         const data = await res.json();
         fullText += data.text + "\n\n---\n\n";
      }
      
      const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, 'extracted_text.md');
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export text.');
    } finally {
      setIsExporting(false);
    }
  };



  return (
    <div className="flex flex-col h-screen w-full bg-[#E4E3E0] text-[#141414] font-['Helvetica_Neue',_Arial,_sans-serif] overflow-hidden">
      {/* Header: Application Identity */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#141414] bg-[#F0EFEC]">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#141414] flex items-center justify-center text-[#E4E3E0] font-bold text-lg">R</div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold uppercase tracking-widest leading-none">Restoration Engine v4.2</h1>
            <p className="text-[10px] font-mono opacity-60 uppercase">High-Fidelity Document Reconstruction / OCR Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-mono opacity-50 uppercase">Session Status</span>
             <span className="text-xs font-mono">LOCAL MODE</span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Split Viewport */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar: Control Panel */}
        <aside className="w-72 border-r border-[#141414] flex flex-col bg-[#DCDAD5] overflow-y-auto">
          <div className="p-3 border-b border-[#141414] bg-[#CFCFCA]">
            <span className="text-[10px] font-bold uppercase font-serif italic">Input & Processing</span>
          </div>
          
          <div className="p-4 flex flex-col gap-6">
            {/* Upload Section */}
            <div className="flex flex-col">
               <span className="text-[10px] font-mono opacity-60 uppercase mb-2">1. Source Files</span>
               <div className="border border-[#141414] bg-[#F0EFEC] p-6 flex flex-col items-center text-center cursor-pointer hover:bg-[#E4E3E0] relative group">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="w-6 h-6 mb-2 opacity-70 group-hover:opacity-100" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Select Files</span>
                  <span className="text-[9px] font-mono opacity-50 mt-1">{files.length > 0 ? `${files.length} FILE(S) LOADED` : 'PNG / JPG'}</span>
               </div>
            </div>

            {/* Process Section */}
            <div className="flex flex-col">
               <span className="text-[10px] font-mono opacity-60 uppercase mb-2">2. Execution</span>
               <button 
                  onClick={processImages}
                  disabled={isProcessing || files.length === 0}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-[#141414] text-[#E4E3E0] text-[11px] font-bold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black"
               >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {isProcessing ? 'Processing Queue...' : 'Execute Restoration'}
               </button>
            </div>

            {/* Export Section */}
            <div className="flex flex-col">
               <span className="text-[10px] font-mono opacity-60 uppercase mb-2">3. Output Artifacts</span>
               <div className="flex flex-col gap-2">
                 <button 
                   onClick={generatePDF}
                   disabled={processedImages.length === 0}
                   className="w-full flex items-center justify-center gap-2 p-2 border border-[#141414] bg-[#F0EFEC] text-[#141414] text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-[#E4E3E0]"
                 >
                   <Download className="w-3 h-3" /> Export A4 PDF
                 </button>
                 <button 
                   onClick={generateZIP}
                   disabled={processedImages.length === 0}
                   className="w-full flex items-center justify-center gap-2 p-2 border border-[#141414] bg-[#F0EFEC] text-[#141414] text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-[#E4E3E0]"
                 >
                   <FileArchive className="w-3 h-3" /> Export PNG Archive
                 </button>
                 <button 
                   onClick={exportText}
                   disabled={isExporting || processedImages.length === 0}
                   className="w-full flex items-center justify-center gap-2 p-2 border border-[#141414] bg-[#F0EFEC] text-[#141414] text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-[#E4E3E0]"
                 >
                   {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                   {isExporting ? 'Extracting...' : 'Export Text (MD)'}
                 </button>
               </div>
            </div>
          </div>
        </aside>

        {/* Restoration Workspace */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest border-l-2 border-[#141414] pl-3">
               Output Workspace {processedImages.length > 0 && `(${processedImages.length} PAGES)`}
            </h2>
            <div className="flex gap-4">
              <span className="text-[10px] font-mono bg-[#F0EFEC] px-2 border border-[#141414]">300 DPI</span>
              <span className="text-[10px] font-mono bg-[#F0EFEC] px-2 border border-[#141414]">A4 PORTRAIT</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-[#141414] bg-[#CFCFCA] p-6 flex flex-wrap gap-6 items-start justify-center">
            {processedImages.length > 0 ? (
               processedImages.map((img, i) => (
                 <div key={i} className="flex flex-col">
                   <div className="text-[9px] font-mono italic mb-1 opacity-60 uppercase tracking-tighter">PAGE_{String(i+1).padStart(2, '0')}</div>
                   <div className="w-64 h-[360px] bg-white border border-[#141414] shadow-xl relative overflow-hidden flex items-center justify-center p-2">
                      <img src={img} alt={`Page ${i+1}`} className="max-w-full max-h-full object-contain" />
                      {/* Scanner Artifact Removal Indicator - purely aesthetic for the theme */}
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-50">
                         <div className="w-1 h-1 bg-[#00FF00]"></div>
                         <div className="w-1 h-1 bg-[#141414]"></div>
                      </div>
                   </div>
                 </div>
               ))
            ) : files.length > 0 ? (
               <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <div className="w-12 h-12 border-2 border-[#141414] rounded-full flex items-center justify-center mb-4">
                     <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest">Awaiting Execution</span>
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <span className="text-[11px] font-bold uppercase tracking-widest">No Input Source</span>
               </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer: System Telemetry */}
      <footer className="h-8 border-t border-[#141414] bg-[#F0EFEC] px-4 flex items-center justify-between text-[10px] font-mono">
        <div className="flex gap-6 items-center">
          <div className="flex gap-2">
            <span className="opacity-40 uppercase">Queue:</span>
            <span>{files.length}</span>
          </div>
          <div className="flex gap-2">
            <span className="opacity-40 uppercase">Processed:</span>
            <span>{processedImages.length}</span>
          </div>
          <div className="flex gap-2 text-[#0066CC]">
            <span className="opacity-100 uppercase">Engine:</span>
            <span>NEURAL_VISION_R7</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <span className="opacity-60 uppercase font-bold tracking-widest text-[9px] mr-4">Made by Aruneshwaran K</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full"></span> SYSTEM_STABLE</span>
        </div>
      </footer>
    </div>
  );
}
