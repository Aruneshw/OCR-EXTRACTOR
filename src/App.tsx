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
  const [apiKey, setApiKey] = useState('');



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
    if (!apiKey.trim()) {
      alert("Please enter a Gemini API Key first.");
      return;
    }
    setIsExporting(true);
    try {
      let fullText = "";
      for (const imgBase64 of processedImages) {
         const base64Data = imgBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
         const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             contents: [
               {
                 parts: [
                   { inlineData: { mimeType: "image/png", data: base64Data } },
                   { text: "Extract all the text and structure from this notes page. Present it as clean Markdown. Preserve all headers, lists, diagrams (described in text), and content exactly as written. Do not summarize or paraphrase." }
                 ]
               }
             ]
           })
         });
         
         if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error?.message || 'Failed to extract text via Gemini');
         }
         const data = await res.json();
         const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
         fullText += extractedText + "\n\n---\n\n";
      }
      
      const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, 'extracted_text.md');
    } catch (err: any) {
      console.error('Export failed:', err);
      alert('Failed to export text. Error: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };



  return (
    <div className="flex flex-col h-screen w-full bg-[#E4E3E0] text-[#141414] font-['Helvetica_Neue',_Arial,_sans-serif] overflow-hidden">
      {/* Header: Application Identity */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[#141414] bg-[#F0EFEC]">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-[#141414] flex items-center justify-center text-[#E4E3E0] font-bold text-sm md:text-lg shrink-0">R</div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold uppercase tracking-widest leading-none">Restoration Engine v4.2</h1>
            <p className="text-[9px] md:text-[10px] font-mono opacity-60 uppercase">High-Fidelity Document Reconstruction / OCR Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-6 hidden md:flex">
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-mono opacity-50 uppercase">Session Status</span>
             <span className="text-xs font-mono">LOCAL MODE</span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Split Viewport */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar: Control Panel */}
        <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-[#141414] flex flex-col bg-[#DCDAD5] overflow-y-auto md:shrink-0 max-h-[50vh] md:max-h-full">
          <div className="p-3 border-b border-[#141414] bg-[#CFCFCA]">
            <span className="text-[10px] font-bold uppercase font-serif italic">Input & Processing</span>
          </div>
          
          <div className="p-4 flex flex-col gap-6">
            {/* Configuration Section */}
            <div className="flex flex-col">
               <span className="text-[10px] font-mono opacity-60 uppercase mb-2">0. Configuration</span>
               <input
                 type="password"
                 placeholder="Gemini API Key"
                 value={apiKey}
                 onChange={(e) => setApiKey(e.target.value)}
                 className="w-full bg-[#F0EFEC] border border-[#141414] p-2 text-[11px] font-mono focus:outline-none focus:bg-white"
               />
               <span className="text-[9px] font-mono opacity-50 mt-1 uppercase">Required for text extraction</span>
            </div>

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
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest border-l-2 border-[#141414] pl-2 md:pl-3">
               Output Workspace {processedImages.length > 0 && `(${processedImages.length} PAGES)`}
            </h2>
            <div className="flex gap-2 md:gap-4">
              <span className="text-[9px] md:text-[10px] font-mono bg-[#F0EFEC] px-2 border border-[#141414] hidden sm:inline-block">300 DPI</span>
              <span className="text-[9px] md:text-[10px] font-mono bg-[#F0EFEC] px-2 border border-[#141414]">A4 PORTRAIT</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-[#141414] bg-[#CFCFCA] p-4 md:p-6 flex flex-wrap gap-4 md:gap-6 items-start justify-center">
            {processedImages.length > 0 ? (
               processedImages.map((img, i) => (
                 <div key={i} className="flex flex-col">
                   <div className="text-[9px] font-mono italic mb-1 opacity-60 uppercase tracking-tighter">PAGE_{String(i+1).padStart(2, '0')}</div>
                   <div className="w-full max-w-[256px] h-auto min-h-[300px] aspect-[1/1.414] bg-white border border-[#141414] shadow-xl relative overflow-hidden flex items-center justify-center p-2 mx-auto">
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
      <footer className="border-t border-[#141414] bg-[#F0EFEC] px-4 py-2 md:h-8 flex flex-wrap items-center justify-between text-[10px] font-mono gap-y-2">
        <div className="flex gap-4 md:gap-6 items-center w-full md:w-auto justify-between md:justify-start">
          <div className="flex gap-2">
            <span className="opacity-40 uppercase hidden sm:inline">Queue:</span>
            <span>{files.length}</span>
          </div>
          <div className="flex gap-2">
            <span className="opacity-40 uppercase hidden sm:inline">Processed:</span>
            <span>{processedImages.length}</span>
          </div>
          <div className="flex gap-2 text-[#0066CC]">
            <span className="opacity-100 uppercase hidden sm:inline">Engine:</span>
            <span>NEURAL_VISION_R7</span>
          </div>
        </div>
        <div className="flex gap-2 md:gap-4 items-center w-full md:w-auto justify-between md:justify-end">
          <span className="opacity-60 uppercase font-bold tracking-widest text-[9px] mr-4">Made by Aruneshwaran K</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full"></span> SYSTEM_STABLE</span>
        </div>
      </footer>
    </div>
  );
}
