import React, { useState, useEffect } from 'react';
import { Plus, Tag, Coins, Sparkles, Loader2, ShoppingCart, X, CheckCircle2, Shield, AlertTriangle, Package, History, Filter, ArrowUpDown, Video, Film, PlayCircle, Bell, TrendingUp, DollarSign, User } from 'lucide-react';
import { generateListingDescription, generateMarketingVideo } from '../services/geminiService';
import { Marble, Order, OrderStatus, Notification } from '../types';

// Mock Data
const MOCK_MARBLES: Marble[] = [
  { id: '1', name: 'Nebula Swirl', description: 'Deep purple with starry flecks. This rare marble was crafted using a unique cooling process that traps air bubbles in a spiral pattern, mimicking a galaxy.', price: 12.50, rarity: 'Rare', imageUrl: 'https://picsum.photos/seed/marble1/600/600', sellerId: 'system' },
  { id: '2', name: 'Cat\'s Eye Classic', description: 'Vintage green cat eye. A staple of any collection, featuring a brilliant emerald core suspended in crystal clear glass.', price: 3.00, rarity: 'Common', imageUrl: 'https://picsum.photos/seed/marble2/600/600', sellerId: 'system' },
  { id: '3', name: 'Dragon Core', description: 'Fiery red center encased in clear glass. The core appears to shift and flicker like a flame when rotated under direct light.', price: 45.00, rarity: 'Legendary', imageUrl: 'https://picsum.photos/seed/marble3/600/600', sellerId: 'system' },
  { id: '4', name: 'Ocean Mist', description: 'Frosted blue texture reminiscent of sea glass found on a foggy morning.', price: 8.00, rarity: 'Uncommon', imageUrl: 'https://picsum.photos/seed/marble4/600/600', sellerId: 'system' },
];

const Marketplace: React.FC = () => {
  const [marbles, setMarbles] = useState<Marble[]>(MOCK_MARBLES);
  const [activeTab, setActiveTab] = useState<'browse' | 'orders'>('browse');
  const [escrowSubTab, setEscrowSubTab] = useState<'buying' | 'selling'>('buying');
  
  // Transactions
  const [orders, setOrders] = useState<Order[]>([]); // My Purchases
  const [sales, setSales] = useState<Order[]>([]);   // My Sales
  
  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter & Sort State
  const [showFilters, setShowFilters] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [sortBy, setSortBy] = useState<string>('newest');

  // Selling State
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellImage, setSellImage] = useState<string | null>(null);
  const [sellVideo, setSellVideo] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<'uploaded' | 'generated' | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{name: string, desc: string, price: string}>({ name: '', desc: '', price: '' });

  // Buying State
  const [selectedMarble, setSelectedMarble] = useState<Marble | null>(null);

  // --- Simulation Effect ---
  useEffect(() => {
    const interval = setInterval(() => {
        // 1. Simulate "Buying" behavior from other users (Buying MY listed items)
        setMarbles(currentMarbles => {
            const myItems = currentMarbles.filter(m => m.sellerId === 'user');
            if (myItems.length > 0 && Math.random() > 0.7) { // 30% chance to sell an item every tick
                const itemToSell = myItems[Math.floor(Math.random() * myItems.length)];
                
                // Create Sale Record
                const newSale: Order = {
                    ...itemToSell,
                    orderId: `ORD-${Date.now()}`,
                    purchaseDate: new Date(),
                    status: OrderStatus.ESCROW_PENDING
                };

                setSales(prev => [newSale, ...prev]);
                
                // Add Notification
                const notif: Notification = {
                    id: Date.now().toString(),
                    title: "Item Sold!",
                    message: `Your listing "${itemToSell.name}" has been purchased. Funds are held in escrow.`,
                    type: 'info',
                    timestamp: new Date(),
                    read: false,
                    orderId: newSale.orderId
                };
                setNotifications(prev => [notif, ...prev]);

                // Remove from marketplace
                return currentMarbles.filter(m => m.id !== itemToSell.id);
            }
            return currentMarbles;
        });

        // 2. Simulate "Buyer" behavior on my active sales (Releasing funds or Disputing)
        setSales(currentSales => {
            let updated = false;
            const newSales = currentSales.map(sale => {
                if (sale.status === OrderStatus.ESCROW_PENDING && Math.random() > 0.8) { // 20% chance to update status
                    updated = true;
                    const isDispute = Math.random() > 0.9; // 10% chance of dispute
                    const newStatus = isDispute ? OrderStatus.DISPUTED : OrderStatus.COMPLETED;
                    
                    // Add Notification
                    const notif: Notification = {
                        id: Date.now().toString() + 'u',
                        title: isDispute ? "Dispute Raised" : "Funds Released",
                        message: isDispute 
                            ? `The buyer has raised a dispute for "${sale.name}". Support will review shortly.`
                            : `Success! Buyer released funds for "${sale.name}". $${sale.price?.toFixed(2)} added to your wallet.`,
                        type: isDispute ? 'error' : 'success',
                        timestamp: new Date(),
                        read: false,
                        orderId: sale.orderId
                    };
                    setNotifications(prev => [notif, ...prev]);
                    
                    return { ...sale, status: newStatus };
                }
                return sale;
            });
            return updated ? newSales : currentSales;
        });

    }, 5000); // Run every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              setSellImage(base64);
              // Auto-fill details using Gemini
              setIsAnalyzing(true);
              try {
                const details = await generateListingDescription(base64.split(',')[1]);
                setNewItem({
                    name: details.name || 'New Marble',
                    desc: details.description || '',
                    price: details.suggestedPrice?.toString() || '0'
                });
              } catch (err) {
                  console.error(err);
              } finally {
                  setIsAnalyzing(false);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setSellVideo(url);
          setVideoType('uploaded');
          setVideoError(null);
      }
  };

  const handleGenerateVeoVideo = async () => {
    if (!sellImage) return;
    setVideoError(null);
    
    // API Key Check for Veo
    // @ts-ignore
    if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        try {
            // @ts-ignore
            await window.aistudio.openSelectKey();
        } catch (e) {
            setVideoError("API Key required for generation.");
            return;
        }
    }

    setIsGeneratingVideo(true);
    try {
        const base64 = sellImage.split(',')[1];
        const videoUrl = await generateMarketingVideo(base64);
        setSellVideo(videoUrl);
        setVideoType('generated');
    } catch (err: any) {
        console.error("Veo generation failed", err);
        setVideoError("Generation failed. Please try again.");
        // @ts-ignore
        if (err.message?.includes('Requested entity was not found') && window.aistudio) {
             // @ts-ignore
             await window.aistudio.openSelectKey();
        }
    } finally {
        setIsGeneratingVideo(false);
    }
  };

  const handleList = () => {
      if(!sellImage) return;
      const marble: Marble = {
          id: Date.now().toString(),
          name: newItem.name,
          description: newItem.desc,
          price: parseFloat(newItem.price),
          imageUrl: sellImage,
          videoUrl: sellVideo || undefined,
          videoType: videoType,
          rarity: 'Common', // Default
          sellerId: 'user'
      };
      setMarbles([marble, ...marbles]);
      setShowSellModal(false);
      setSellImage(null);
      setSellVideo(null);
      setVideoType(undefined);
      setVideoError(null);
      setNewItem({name:'', desc:'', price:''});
  };

  const confirmPurchase = () => {
    if (!selectedMarble) return;
    
    const newOrder: Order = {
        ...selectedMarble,
        orderId: `ORD-${Date.now()}`,
        purchaseDate: new Date(),
        status: OrderStatus.ESCROW_PENDING
    };

    setOrders([newOrder, ...orders]);
    setMarbles(marbles.filter(m => m.id !== selectedMarble.id));
    setSelectedMarble(null);
    setActiveTab('orders');
    setEscrowSubTab('buying');
  };

  const releaseFunds = (orderId: string) => {
      setOrders(orders.map(o => o.orderId === orderId ? { ...o, status: OrderStatus.COMPLETED } : o));
  };

  const raiseDispute = (orderId: string) => {
      setOrders(orders.map(o => o.orderId === orderId ? { ...o, status: OrderStatus.DISPUTED } : o));
  };
  
  const markNotificationsRead = () => {
      setNotifications(notifications.map(n => ({...n, read: true})));
  };

  // Calculations
  const sellPrice = parseFloat(newItem.price) || 0;
  const sellFee = sellPrice * 0.05;
  const sellNet = sellPrice - sellFee;

  // Filter Logic
  const filteredMarbles = marbles.filter(m => {
      if (rarityFilter !== 'All' && m.rarity !== rarityFilter) return false;
      
      const price = m.price || 0;
      const min = priceRange.min ? parseFloat(priceRange.min) : 0;
      const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      
      return price >= min && price <= max;
  }).sort((a, b) => {
      switch (sortBy) {
          case 'price_asc': return (a.price || 0) - (b.price || 0);
          case 'price_desc': return (b.price || 0) - (a.price || 0);
          case 'newest': default: return parseInt(b.id) - parseInt(a.id);
      }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 h-full flex flex-col relative" onClick={() => showNotifications && setShowNotifications(false)}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500">
            Marketplace
            </h2>
            <p className="text-gray-400">Secure trading with automated escrow protection</p>
        </div>
        
        <div className="flex gap-4 items-center">
            {/* Notifications */}
            <div className="relative">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); if(!showNotifications) markNotificationsRead(); }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 relative transition-colors"
                >
                    <Bell className="w-5 h-5 text-gray-300" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                </button>
                
                {showNotifications && (
                    <div className="absolute right-0 top-12 w-80 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/20">
                            <h4 className="font-bold text-sm text-gray-200">Notifications</h4>
                            <button onClick={() => setNotifications([])} className="text-xs text-gray-500 hover:text-white">Clear All</button>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">No new notifications</div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-white/[0.02]' : ''}`}>
                                        <div className="flex gap-2 items-start">
                                            {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />}
                                            {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />}
                                            {notif.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                                            {notif.type === 'info' && <Tag className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />}
                                            
                                            <div>
                                                <h5 className={`text-sm font-semibold ${!notif.read ? 'text-white' : 'text-gray-400'}`}>{notif.title}</h5>
                                                <p className="text-xs text-gray-400 mt-0.5">{notif.message}</p>
                                                <span className="text-[10px] text-gray-600 mt-1 block">{notif.timestamp.toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                    onClick={() => setActiveTab('browse')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'browse' ? 'bg-white/10 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    Browse
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white/10 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    My Escrow
                    {(orders.some(o => o.status === OrderStatus.ESCROW_PENDING) || sales.some(s => s.status === OrderStatus.ESCROW_PENDING)) && (
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    )}
                </button>
            </div>

            <button 
                onClick={() => setShowSellModal(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-yellow-500/20"
            >
                <Plus className="w-5 h-5" /> Sell
            </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <div className="flex-1 flex flex-col min-h-0">
             {/* Filter Controls */}
             <div className="flex flex-col mb-6 gap-4 flex-shrink-0">
                <div className="flex gap-4 overflow-x-auto pb-2 items-center">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${showFilters ? 'bg-white/10 border-yellow-500/50 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                    
                    <div className="h-6 w-px bg-white/10 mx-2" />

                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <ArrowUpDown className="w-4 h-4 text-gray-500" />
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent text-sm text-gray-300 outline-none cursor-pointer [&>option]:bg-[#1a1a2e]"
                        >
                            <option value="newest">Newest First</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                {showFilters && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Rarity</label>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Common', 'Uncommon', 'Rare', 'Legendary'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRarityFilter(r)}
                                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                            rarityFilter === r 
                                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' 
                                            : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Price Range</label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                    <input 
                                        type="number" 
                                        placeholder="Min" 
                                        value={priceRange.min}
                                        onChange={e => setPriceRange({...priceRange, min: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-6 pr-3 text-sm text-white focus:border-yellow-500 outline-none"
                                    />
                                </div>
                                <span className="text-gray-500">-</span>
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                    <input 
                                        type="number" 
                                        placeholder="Max" 
                                        value={priceRange.max}
                                        onChange={e => setPriceRange({...priceRange, max: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-6 pr-3 text-sm text-white focus:border-yellow-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto pb-20 custom-scrollbar flex-1">
                {filteredMarbles.map(marble => (
                <div 
                    key={marble.id} 
                    onClick={() => setSelectedMarble(marble)}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:border-yellow-500/30 transition-all hover:-translate-y-1 flex flex-col flex-shrink-0 min-h-[320px] cursor-pointer"
                >
                    <div className="h-48 overflow-hidden relative bg-black/20">
                    <img src={marble.imageUrl} alt={marble.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {marble.videoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                            <PlayCircle className="w-12 h-12 text-white/80 drop-shadow-lg" />
                        </div>
                    )}
                    <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full border backdrop-blur-md ${
                        marble.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                        marble.rarity === 'Rare' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' :
                        'bg-gray-500/20 text-gray-300 border-gray-500/50'
                    }`}>
                        {marble.rarity}
                    </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white truncate pr-2">{marble.name}</h3>
                        <span className="flex items-center text-yellow-400 font-mono font-bold text-sm">
                        <Coins className="w-3 h-3 mr-1" /> {marble.price?.toFixed(2)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">{marble.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                         <div className="flex gap-2 items-center text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                            <Shield className="w-3 h-3" /> Escrow
                        </div>
                        {marble.videoUrl && (
                            <div className={`flex gap-2 items-center text-xs px-2 py-1 rounded border ${
                                marble.videoType === 'generated' 
                                ? 'text-violet-400 bg-violet-400/10 border-violet-400/20' 
                                : 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                            }`}>
                                <Video className="w-3 h-3" /> {marble.videoType === 'generated' ? 'AI Preview' : 'Verified'}
                            </div>
                        )}
                        {marble.sellerId === 'user' && (
                             <div className="flex gap-2 items-center text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
                                <Tag className="w-3 h-3" /> Your Listing
                            </div>
                        )}
                    </div>
                    {marble.sellerId === 'user' ? (
                        <div className="w-full bg-white/5 border border-white/10 text-gray-500 text-sm py-2 rounded-lg text-center cursor-default">
                            Listed by You
                        </div>
                    ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedMarble(marble); }}
                            className="w-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 hover:text-emerald-400 text-sm py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
                        >
                            <ShoppingCart className="w-4 h-4" /> Buy Now
                        </button>
                    )}
                    </div>
                </div>
                ))}
                {filteredMarbles.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-500">
                        <p>No marbles match your filters.</p>
                        <button 
                            onClick={() => {setRarityFilter('All'); setPriceRange({min:'', max:''})}}
                            className="mt-2 text-yellow-400 hover:underline text-sm"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
             {/* Escrow Sub-tabs */}
             <div className="flex gap-4 mb-4 border-b border-white/10 pb-4">
                 <button 
                    onClick={() => setEscrowSubTab('buying')}
                    className={`text-sm font-bold pb-1 transition-colors ${escrowSubTab === 'buying' ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                     My Purchases ({orders.length})
                 </button>
                 <button 
                    onClick={() => setEscrowSubTab('selling')}
                    className={`text-sm font-bold pb-1 transition-colors ${escrowSubTab === 'selling' ? 'text-white border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                     My Sales ({sales.length})
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar space-y-4">
                 {(escrowSubTab === 'buying' ? orders : sales).length === 0 ? (
                     <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                         <History className="w-16 h-16 mb-4 opacity-50" />
                         <p>No {escrowSubTab} history found.</p>
                     </div>
                 ) : (
                     (escrowSubTab === 'buying' ? orders : sales).map(order => (
                         <div key={order.orderId} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-6 items-center">
                             <div className="w-24 h-24 bg-black/30 rounded-lg overflow-hidden flex-shrink-0">
                                 <img src={order.imageUrl} alt={order.name} className="w-full h-full object-cover" />
                             </div>
                             
                             <div className="flex-1 text-center md:text-left">
                                 <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                    <h3 className="font-bold text-lg text-white">{order.name}</h3>
                                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">{order.orderId}</span>
                                    {escrowSubTab === 'selling' && (
                                        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">Sold Item</span>
                                    )}
                                 </div>
                                 <p className="text-gray-400 text-sm mb-2">Transaction started {order.purchaseDate.toLocaleDateString()}</p>
                                 <div className="flex items-center justify-center md:justify-start gap-2">
                                     <Coins className="w-4 h-4 text-yellow-400" />
                                     <span className="font-mono font-bold text-white">{order.price?.toFixed(2)}</span>
                                 </div>
                             </div>

                             {/* Status Section */}
                             <div className="w-full md:w-64 bg-black/20 rounded-lg p-4 border border-white/5">
                                 {order.status === OrderStatus.ESCROW_PENDING && (
                                     <>
                                         <div className="flex items-center gap-2 text-yellow-400 mb-3 font-bold text-sm">
                                             <Shield className="w-4 h-4" /> Funds held in Escrow
                                         </div>
                                         <p className="text-xs text-gray-500 mb-4">
                                             {escrowSubTab === 'buying' 
                                                ? "Funds are safe. Only release when you have received the item."
                                                : "Funds secure. Waiting for buyer to confirm receipt."}
                                         </p>
                                         
                                         {escrowSubTab === 'buying' ? (
                                             <div className="flex gap-2">
                                                 <button 
                                                    onClick={() => releaseFunds(order.orderId)}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 rounded font-bold transition-colors"
                                                >
                                                     Release Funds
                                                 </button>
                                                 <button 
                                                    onClick={() => raiseDispute(order.orderId)}
                                                    className="px-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 border border-white/10 text-xs rounded transition-colors"
                                                 >
                                                     Dispute
                                                 </button>
                                             </div>
                                         ) : (
                                             <div className="text-center text-xs text-yellow-500/70 font-mono bg-yellow-500/5 p-2 rounded">
                                                 Awaiting Buyer Action...
                                             </div>
                                         )}
                                     </>
                                 )}
                                 {order.status === OrderStatus.COMPLETED && (
                                     <div className="flex flex-col items-center justify-center h-full text-emerald-400">
                                         <CheckCircle2 className="w-8 h-8 mb-2" />
                                         <span className="font-bold text-sm">Transaction Complete</span>
                                         <span className="text-xs text-emerald-500/70">
                                            {escrowSubTab === 'buying' ? "Funds released to seller" : "Funds added to your wallet"}
                                         </span>
                                     </div>
                                 )}
                                 {order.status === OrderStatus.DISPUTED && (
                                     <div className="flex flex-col items-center justify-center h-full text-red-400">
                                         <AlertTriangle className="w-8 h-8 mb-2" />
                                         <span className="font-bold text-sm">Dispute Open</span>
                                         <span className="text-xs text-red-500/70">Support will review within 24h</span>
                                     </div>
                                 )}
                             </div>
                         </div>
                     ))
                 )}
             </div>
        </div>
      )}

      {/* Enhanced Detail / Buy Modal */}
      {selectedMarble && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-[#1a1a2e] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative animate-fade-in flex flex-col max-h-[90vh]">
                
                {/* Header / Media Area */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden flex-shrink-0">
                     <button onClick={() => setSelectedMarble(null)} className="absolute top-4 right-4 text-white/50 hover:text-white z-20 bg-black/50 p-2 rounded-full backdrop-blur-sm">
                        <X className="w-6 h-6" />
                    </button>
                    
                    {selectedMarble.videoUrl ? (
                         <video controls src={selectedMarble.videoUrl} className="w-full h-full object-contain" />
                    ) : (
                        <img src={selectedMarble.imageUrl} alt={selectedMarble.name} className="w-full h-full object-contain" />
                    )}

                    {/* Type Badge Overlay */}
                    {selectedMarble.videoUrl && (
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-xs text-white border border-white/10">
                            {selectedMarble.videoType === 'generated' ? (
                                <>
                                    <Sparkles className="w-3 h-3 text-violet-400" /> 
                                    <span>AI Cinematic Preview</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 
                                    <span>Verified Video</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                             <h3 className="text-2xl font-bold text-white mb-1">{selectedMarble.name}</h3>
                             <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded border ${
                                    selectedMarble.rarity === 'Legendary' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                    selectedMarble.rarity === 'Rare' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                    'bg-gray-500/10 text-gray-300 border-gray-500/30'
                                }`}>
                                    {selectedMarble.rarity}
                                </span>
                                <span className="text-xs text-gray-500">ID: #{selectedMarble.id.slice(-6)}</span>
                             </div>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center justify-end gap-1 text-2xl font-mono font-bold text-yellow-400">
                                 <Coins className="w-6 h-6" /> {selectedMarble.price?.toFixed(2)}
                             </div>
                        </div>
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center gap-3 mb-6 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-300 font-bold">
                                {selectedMarble.sellerId === 'user' ? 'You' : 'System Vendor'}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                {selectedMarble.sellerId === 'system' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                                {selectedMarble.sellerId === 'system' ? 'Verified Official Seller' : 'Community Member'}
                            </p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                        <p className="text-gray-300 leading-relaxed text-sm">
                            {selectedMarble.description}
                        </p>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Transaction Details</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-400">
                                <span>Item Price</span>
                                <span className="font-mono text-white">{selectedMarble.price?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Escrow Fee (Safety Protection)</span>
                                <span className="font-mono text-white">1.00</span>
                            </div>
                            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center">
                                <span className="font-bold text-gray-200">Total Pay</span>
                                <span className="font-mono text-lg font-bold text-yellow-400">
                                    {((selectedMarble.price || 0) + 1.00).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Escrow Note */}
                    {selectedMarble.sellerId !== 'user' && (
                        <div className="flex gap-3 mb-6">
                            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            <p className="text-xs text-gray-400">
                                <span className="text-emerald-400 font-bold">Escrow Protected:</span> Funds are held securely in a neutral smart contract. You release the funds only after you have received and verified the item.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-black/20 flex gap-4 flex-shrink-0">
                    {selectedMarble.sellerId === 'user' ? (
                        <button 
                            onClick={() => setSelectedMarble(null)}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Close Preview
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={() => setSelectedMarble(null)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-3 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmPurchase}
                                className="flex-[2] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                <Shield className="w-4 h-4" /> Pay to Escrow
                            </button>
                        </>
                    )}
                </div>
             </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#1a1a2e] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <button onClick={() => setShowSellModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10">
                      <X className="w-6 h-6" />
                  </button>
                  <h3 className="text-xl font-bold text-white mb-4">List Item</h3>
                  
                  <div className="space-y-4">
                      {/* Image Upload */}
                      <div className="border-2 border-dashed border-white/20 rounded-xl h-40 flex flex-col items-center justify-center relative bg-black/20 group overflow-hidden">
                          {sellImage ? (
                              <img src={sellImage} className="h-full w-full object-contain rounded-xl" />
                          ) : (
                              <>
                                <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                                <Tag className="w-8 h-8 text-gray-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-gray-400 text-sm">Tap to upload photo</span>
                              </>
                          )}
                          {isAnalyzing && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-xl z-20 backdrop-blur-sm">
                                  <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-2" />
                                  <span className="text-yellow-400 text-xs font-bold animate-pulse">AI is writing description...</span>
                              </div>
                          )}
                      </div>

                      {/* Video Verification Section */}
                      {sellImage && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <Video className="w-3 h-3" /> Video Verification
                              </label>
                              
                              {sellVideo ? (
                                  <div className="space-y-2">
                                      <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black">
                                          <video src={sellVideo} className="w-full h-32 object-contain" controls />
                                          <button 
                                            onClick={() => { setSellVideo(null); setVideoType(undefined); }}
                                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-red-500/50 text-white transition-colors z-10"
                                          >
                                              <X className="w-4 h-4" />
                                          </button>
                                      </div>
                                      <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                                          <div className={`w-2 h-2 rounded-full ${videoType === 'generated' ? 'bg-violet-400' : 'bg-emerald-400'}`} />
                                          <span className="text-xs font-bold text-white">Verified</span>
                                          <span className="text-[10px] text-gray-500 ml-auto border border-white/10 px-2 py-0.5 rounded">
                                              {videoType === 'generated' ? 'AI Generated' : 'Manual Upload'}
                                          </span>
                                      </div>
                                  </div>
                              ) : isGeneratingVideo ? (
                                  <div className="h-32 bg-black/30 rounded-lg flex flex-col items-center justify-center border border-violet-500/30">
                                      <div className="flex items-center gap-2 text-violet-400 mb-1">
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          <span className="text-sm font-bold">Processing</span>
                                      </div>
                                      <span className="text-xs text-gray-500">Creating cinematic preview...</span>
                                  </div>
                              ) : (
                                  <div className="space-y-2">
                                      {videoError && (
                                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-2 text-red-400 text-xs">
                                              <AlertTriangle className="w-4 h-4" />
                                              {videoError}
                                          </div>
                                      )}
                                      <div className="flex gap-2">
                                          <div className="relative flex-1">
                                              <input type="file" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="video/*" />
                                              <button className="w-full h-full bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg py-3 text-xs text-gray-300 flex flex-col items-center gap-1 transition-colors">
                                                  <Video className="w-4 h-4" />
                                                  Upload Proof
                                              </button>
                                          </div>
                                          <button 
                                            onClick={handleGenerateVeoVideo}
                                            className="flex-1 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 hover:border-violet-500/50 rounded-lg py-3 text-xs text-violet-300 hover:text-violet-200 flex flex-col items-center gap-1 transition-all"
                                          >
                                              <Sparkles className="w-4 h-4" />
                                              Generate AI Promo
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}

                      <input 
                        value={newItem.name} 
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        placeholder="Item Name" 
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition-colors" 
                      />
                      <textarea 
                        value={newItem.desc}
                        onChange={(e) => setNewItem({...newItem, desc: e.target.value})}
                        placeholder="Description" 
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-yellow-500 outline-none h-24 resize-none transition-colors" 
                      />
                      
                      {/* Price Input and Fee Logic */}
                      <div className="space-y-2">
                          <div className="relative">
                              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                              <input 
                                type="number" 
                                value={newItem.price}
                                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                                placeholder="Listing Price" 
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-yellow-500 outline-none font-mono" 
                            />
                          </div>
                          
                          {sellPrice > 0 && (
                            <div className="bg-white/5 rounded-lg p-3 text-xs space-y-1 border border-white/5">
                                <div className="flex justify-between text-gray-400">
                                    <span>Listing Price</span>
                                    <span>{sellPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-red-400">
                                    <span>Platform Fee (5%)</span>
                                    <span>-{sellFee.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-white/10 pt-1 mt-1 flex justify-between font-bold text-sm">
                                    <span className="text-gray-300">You Receive</span>
                                    <span className="text-green-400 flex items-center gap-1">
                                        <Coins className="w-3 h-3" /> {sellNet.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                          )}
                      </div>
                      
                      <button 
                        onClick={handleList}
                        disabled={!sellImage || isAnalyzing || isGeneratingVideo || !newItem.name || !newItem.price}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 transition-all"
                      >
                          <Sparkles className="w-4 h-4" /> List for Sale
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Marketplace;