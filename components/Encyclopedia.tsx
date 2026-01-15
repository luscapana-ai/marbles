import React, { useState } from 'react';
import { Search, Loader2, BookOpen, ExternalLink, Tag } from 'lucide-react';
import { searchMarbles } from '../services/geminiService';
import { SearchResult } from '../types';
import ReactMarkdown from 'react-markdown';

const MARBLE_TYPES = [
  "Agate", "Akro Agate", "Alley Agate", "Bennington", "Bumblebee",
  "Cat's Eye", "China", "Christensen", "Clambroth", "Clearie",
  "Corkscrew", "End of Day", "Galaxy", "Ghost", "Guinea",
  "Indian", "Lutz", "Mica", "Onion Skin", "Oxblood",
  "Peltier", "Peppermint", "Pontil", "Popeye", "Slag",
  "Steelie", "Sulphide", "Swirl", "Turtle"
];

const Encyclopedia: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInfo = async (searchTerm: string) => {
    setLoading(true);
    setResult(null);
    try {
      const data = await searchMarbles(searchTerm);
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({ text: "An error occurred while fetching data. Please try again.", sources: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchInfo(query);
  };

  const handleTypeClick = (type: string) => {
      const q = `${type} marble history, identification, and value`;
      setQuery(q);
      fetchInfo(q);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-full flex flex-col">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-500">
          Marble Encyclopedia
        </h2>
        <p className="text-gray-400">Powered by Gemini & Google Search</p>
      </div>

      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative mb-6">
            <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about marble history, types (e.g., 'Sulphide Marbles'), or rules..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-xl"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <button 
            type="submit"
            disabled={loading || !query}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
        </form>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Browse A-Z
            </h3>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                {MARBLE_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => handleTypeClick(type)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg bg-black/20 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/50 text-xs text-gray-300 hover:text-white transition-all whitespace-nowrap"
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {result ? (
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl animate-fade-in">
             <div className="prose prose-invert max-w-none prose-a:text-emerald-400 prose-headings:text-emerald-300">
                <ReactMarkdown>{result.text}</ReactMarkdown>
             </div>
             
             {result.sources.length > 0 && (
               <div className="mt-8 pt-6 border-t border-white/10">
                 <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                   <BookOpen className="w-4 h-4" /> Sources
                 </h4>
                 <div className="flex flex-wrap gap-2">
                   {result.sources.map((source, idx) => (
                     <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full text-xs text-gray-300 hover:text-white transition-colors border border-white/5"
                    >
                      {source.title} <ExternalLink className="w-3 h-3" />
                     </a>
                   ))}
                 </div>
               </div>
             )}
          </div>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50 pb-20">
              <BookOpen className="w-16 h-16 mb-4" />
              <p>Select a marble type or search to begin learning.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Encyclopedia;