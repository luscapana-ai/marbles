import React, { useState, useRef } from 'react';
import { Upload, Loader2, ScanEye, X } from 'lucide-react';
import { analyzeMarbleImage } from '../services/geminiService';

const Analyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const base64Data = image.split(',')[1];
      const result = await analyzeMarbleImage(base64Data, "Identify this marble type, materials, probable era, and condition.");
      setAnalysis(result || "Could not analyze the image.");
    } catch (error) {
      setAnalysis("Error analyzing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setAnalysis('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-full flex flex-col md:flex-row gap-8">
      {/* Input Section */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-500 flex items-center gap-2">
          <ScanEye className="text-pink-400" /> Marble Identifier
        </h2>
        
        <div className="flex-1 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden group hover:border-pink-500/50 transition-colors">
          {image ? (
            <>
              <img src={image} alt="Preview" className="max-h-[400px] w-auto object-contain rounded-lg shadow-2xl" />
              <button 
                onClick={clearImage}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-colors backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-16 h-16 text-gray-500 mb-4 mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-gray-300 font-medium">Upload a photo of your marble</p>
              <p className="text-gray-500 text-sm mt-2">Supports JPG, PNG</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!image || loading}
          className="mt-6 w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanEye className="w-5 h-5" />}
          {loading ? 'Analyzing...' : 'Identify Marble'}
        </button>
      </div>

      {/* Result Section */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Analysis Result</h3>
        {analysis ? (
          <div className="prose prose-invert prose-sm">
             <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
               {analysis}
             </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            Analysis details will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default Analyzer;