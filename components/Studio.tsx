import React, { useState } from 'react';
import { Image as ImageIcon, Wand2, Loader2, Key } from 'lucide-react';
import { generateMarbleDesign } from '../services/geminiService';
import { ImageSize } from '../types';

const Studio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    // Check for API key first
    // @ts-ignore
    if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        try {
            // @ts-ignore
            await window.aistudio.openSelectKey();
             // Race condition mitigation: assume success if no error thrown immediately
        } catch (e) {
            setError("Could not select API Key.");
            return;
        }
    }

    setLoading(true);
    setError(null);
    try {
      const img = await generateMarbleDesign(prompt + " A high quality, photorealistic macro shot of a single glass marble, isolated on black background.", size);
      setGeneratedImage(img);
    } catch (err: any) {
      if (err.message?.includes('Requested entity was not found')) {
         // @ts-ignore
         if (window.aistudio) {
             // @ts-ignore
             await window.aistudio.openSelectKey();
             setError("API Key invalid or not found. Please try again.");
         }
      } else {
         setError("Failed to generate image. Try a different prompt.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-full flex flex-col">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">
          Marble Design Studio
        </h2>
        <p className="text-gray-400 text-sm">Create unique marbles using Veo-class generation models.</p>
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
            <Key className="w-3 h-3" /> Requires paid API Key selection
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-1/3 flex flex-col gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., A swirl of galaxy colors with gold flecks..."
                    className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
                />
            </div>
            
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
                <div className="flex gap-2">
                    {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setSize(s)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                size === s 
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
                                : 'bg-black/20 text-gray-400 hover:bg-black/40'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="mt-auto w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                Generate
            </button>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </div>

        <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center p-4 relative">
             {generatedImage ? (
                 <img src={generatedImage} alt="Generated Marble" className="max-h-full max-w-full rounded-lg shadow-2xl object-contain" />
             ) : (
                 <div className="text-center text-gray-600">
                     {loading ? (
                         <div className="flex flex-col items-center gap-4">
                             <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                             <p className="animate-pulse">Weaving light into glass...</p>
                         </div>
                     ) : (
                         <>
                            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Your masterpiece awaits.</p>
                         </>
                     )}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default Studio;