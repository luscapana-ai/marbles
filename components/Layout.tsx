import React, { ReactNode } from 'react';
import { Gamepad2, Book, ShoppingBag, ScanEye } from 'lucide-react';
import { GameMode } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentMode: GameMode;
  setMode: (mode: GameMode) => void;
}

const NavButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    icon: React.ElementType; 
    label: string; 
    colorClass: string 
}> = ({ active, onClick, icon: Icon, label, colorClass }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 md:w-20 ${
      active 
        ? `${colorClass} bg-opacity-20 text-white scale-110 shadow-lg` 
        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
    }`}
  >
    <Icon className={`w-6 h-6 md:w-7 md:h-7 ${active ? 'fill-current' : ''}`} />
    <span className="text-[10px] md:text-xs font-medium">{label}</span>
  </button>
);

const Layout: React.FC<LayoutProps> = ({ children, currentMode, setMode }) => {
  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#1a1a2e]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center">
            <span className="text-xl">🔮</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">Marbleverse</h1>
        </div>
        <div className="text-xs text-gray-500 border border-white/10 px-3 py-1 rounded-full">
            Alpha v1.0
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* Sticky Bottom Navigation */}
      <nav className="h-20 md:h-24 bg-[#1a1a2e]/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-2 md:gap-8 px-4 z-20 pb-safe">
        <NavButton 
            active={currentMode === GameMode.PLAY} 
            onClick={() => setMode(GameMode.PLAY)} 
            icon={Gamepad2} 
            label="Play"
            colorClass="text-blue-400 bg-blue-400"
        />
        <NavButton 
            active={currentMode === GameMode.ENCYCLOPEDIA} 
            onClick={() => setMode(GameMode.ENCYCLOPEDIA)} 
            icon={Book} 
            label="Wiki"
            colorClass="text-emerald-400 bg-emerald-400"
        />
        <NavButton 
            active={currentMode === GameMode.ANALYZER} 
            onClick={() => setMode(GameMode.ANALYZER)} 
            icon={ScanEye} 
            label="Identify"
            colorClass="text-pink-400 bg-pink-400"
        />
        <NavButton 
            active={currentMode === GameMode.MARKETPLACE} 
            onClick={() => setMode(GameMode.MARKETPLACE)} 
            icon={ShoppingBag} 
            label="Market"
            colorClass="text-yellow-400 bg-yellow-400"
        />
      </nav>
    </div>
  );
};

export default Layout;