import React, { useState } from 'react';
import { 
  Layers, AlignCenter, AlignLeft, AlignRight, 
  Maximize, Check, Palette, Type,
  Grid, Download, Move, Box, Image as ImageIcon,
  Lock, Unlock, AlertTriangle, RotateCcw
} from 'lucide-react';
import { BRAND } from './constants';

const App: React.FC = () => {
  // --- Brand State ---
  const [text1, setText1] = useState('PROMOTIONAL');
  const [text2, setText2] = useState('HEADING STYLE');
  const [style, setStyle] = useState<'standard' | 'overlapping'>('overlapping');
  const [composition, setComposition] = useState<'range' | 'offset'>('range');
  const [stacking, setStacking] = useState<'box1' | 'box2'>('box2');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [theme, setTheme] = useState('primary'); 
  const [canvasBg, setCanvasBg] = useState('white');
  const [fontSize, setFontSize] = useState(100);
  const [assetScale, setAssetScale] = useState(0.8);
  const [showGrid, setShowGrid] = useState(false);
  const [toast, setToast] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // New Spacing State
  const BRAND_DEFAULTS = { word: 0.3, letter: 0.02 };
  const [wordSpacing, setWordSpacing] = useState(BRAND_DEFAULTS.word);
  const [letterSpacing, setLetterSpacing] = useState(BRAND_DEFAULTS.letter);
  const [isSpacingLocked, setIsSpacingLocked] = useState(true);

  // --- Brand Logic Constants ---
  const capHeight = fontSize * BRAND.metrics.capHeightRatio;
  const brandPadding = capHeight * BRAND.metrics.paddingRatio;
  const totalBoxHeight = capHeight + (brandPadding * 2);
  const distUnit = capHeight * BRAND.metrics.offsetRatio;
  const shiftPx = capHeight * BRAND.metrics.shiftRatio;

  // Geometry compensation for rotation
  const rotationComp = Math.abs(Math.sin(BRAND.metrics.angle * Math.PI / 180) * 400); 
  
  // Gap between boxes
  const boxStackOffset = style === 'standard' 
    ? (distUnit + rotationComp) 
    : (-distUnit + rotationComp);
  
  // Bionic Shift (indentation)
  let horizontalShift = 0;
  if (composition === 'offset') {
    if (alignment === 'left') horizontalShift = shiftPx;
    if (alignment === 'right') horizontalShift = -shiftPx;
  }

  const getThemeColors = (boxNum: number) => {
    if (theme === 'alt') return boxNum === 1 ? { bg: BRAND.colors.navy, text: BRAND.colors.white } : { bg: BRAND.colors.orange, text: BRAND.colors.navy };
    if (theme === 'blue') return boxNum === 1 ? { bg: BRAND.colors.blue, text: BRAND.colors.white } : { bg: BRAND.colors.navy, text: BRAND.colors.white };
    if (theme === 'grey') return boxNum === 1 ? { bg: BRAND.colors.grey, text: BRAND.colors.navy } : { bg: BRAND.colors.white, text: BRAND.colors.navy };
    // Primary
    return boxNum === 1 ? { bg: BRAND.colors.orange, text: BRAND.colors.navy } : { bg: BRAND.colors.navy, text: BRAND.colors.white };
  };

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const resetSpacing = () => {
    setWordSpacing(BRAND_DEFAULTS.word);
    setLetterSpacing(BRAND_DEFAULTS.letter);
    showNotification("Spacing Reset to Brand Standard");
  };

  /**
   * HIGH-FIDELITY HD EXPORT ENGINE
   * @param exportMode 'master' (full bg), 'layer1' (top only), 'layer2' (bottom only), 'combo' (both transparent)
   */
  const exportAsset = async (exportMode: 'master' | 'layer1' | 'layer2' | 'combo') => {
    if (isExporting) return;
    setIsExporting(true);
    
    const isTransparent = exportMode !== 'master';
    showNotification(isTransparent ? `Exporting ${exportMode}...` : "Synthesizing HD Master...");

    // Wait for fonts
    await document.fonts.ready;

    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        setIsExporting(false);
        return;
    }

    // 1. Setup Background
    ctx.clearRect(0, 0, 1920, 1080);
    if (!isTransparent && canvasBg !== 'transparent') {
      ctx.fillStyle = BRAND.colors[canvasBg as keyof typeof BRAND.colors] || '#ffffff';
      ctx.fillRect(0, 0, 1920, 1080);
    }

    // 2. Advanced Text Measurement Engine
    // This ensures that the canvas measures text exactly the same way the logic calculates boxes
    // including custom word spacing and tracking.
    const measureLayout = (txt: string) => {
      ctx.font = `900 ${fontSize}px Poppins, sans-serif`;
      const chars = [...(txt || ' ')];
      
      let cursor = 0;
      const charData = chars.map(char => {
         const metrics = ctx.measureText(char);
         const w = metrics.width;
         
         // Apply spacing logic
         const tracking = fontSize * letterSpacing;
         const wordSpace = (char === ' ') ? (fontSize * wordSpacing) : 0;
         
         const charTotalWidth = w + tracking + wordSpace;
         
         const data = { char, x: cursor, width: charTotalWidth };
         cursor += charTotalWidth;
         return data;
      });

      // The box width includes the brand padding on both sides
      const textWidth = cursor;
      const boxWidth = textWidth + (brandPadding * 2);
      
      return { boxWidth, textWidth, charData };
    };

    const layout1 = measureLayout(text1);
    const layout2 = measureLayout(text2);
    
    // Calculate Group Dimensions
    const maxWidth = Math.max(layout1.boxWidth, layout2.boxWidth);
    const screenCenter = 1920 / 2;
    const screenCenterY = 1080 / 2;

    // 3. Alignment Logic (Matches CSS Flexbox behavior)
    // The "Group" of two boxes is always centered on screen.
    // The alignment determines how the boxes sit relative to each other within that centered group.
    const getAlignedCenterX = (boxWidth: number) => {
      if (alignment === 'center') return screenCenter;
      
      const groupLeft = screenCenter - (maxWidth / 2);
      const groupRight = screenCenter + (maxWidth / 2);

      if (alignment === 'left') return groupLeft + (boxWidth / 2);
      if (alignment === 'right') return groupRight - (boxWidth / 2);
      
      return screenCenter;
    };

    // 4. Draw Helper
    const drawHeading = (num: number) => {
      // Skip drawing if we only want one specific layer
      if (exportMode === 'layer1' && num !== 1) return;
      if (exportMode === 'layer2' && num !== 2) return;

      const colors = getThemeColors(num);
      const angleVal = num === 1 ? BRAND.metrics.angle : -BRAND.metrics.angle;
      const rot = angleVal * (Math.PI / 180);
      const layout = num === 1 ? layout1 : layout2;
      
      // Vertical Position Calculation
      const distBetweenCenters = totalBoxHeight + boxStackOffset;

      // Offsets from Center Y
      // Box 1 is above center, Box 2 is below center
      const box1Y = -distBetweenCenters / 2;
      const box2Y = distBetweenCenters / 2;

      const relativeY = num === 1 ? box1Y : box2Y;
      
      // Horizontal Position Calculation
      const alignedX = getAlignedCenterX(layout.boxWidth);
      
      // Add Bionic Shift (only affects Box 2)
      const shiftX = num === 1 ? 0 : horizontalShift;
      
      const finalX = alignedX + shiftX;
      const finalY = screenCenterY + relativeY;

      ctx.save();
      ctx.translate(finalX, finalY);
      ctx.rotate(rot);

      ctx.font = `900 ${fontSize}px Poppins, sans-serif`;

      // Draw Box
      ctx.fillStyle = colors.bg;
      if (!isTransparent) {
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 20;
      }
      ctx.fillRect(-layout.boxWidth/2, -totalBoxHeight/2, layout.boxWidth, totalBoxHeight);

      // Draw Text
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = colors.text;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      
      // Draw Loop
      // Start position: Left edge of box + padding
      const startX = -layout.boxWidth/2 + brandPadding;
      const yAdjust = fontSize * 0.05; // Poppins optical adjustment

      layout.charData.forEach(item => {
         ctx.fillText(item.char, startX + item.x, yAdjust);
      });

      ctx.restore();
    };

    // Draw Order
    if (stacking === 'box1') {
      drawHeading(2); // Box 2 Bottom
      drawHeading(1); // Box 1 Top
    } else {
      drawHeading(1);
      drawHeading(2);
    }

    // Save
    setTimeout(() => {
      const link = document.createElement('a');
      const suffix = exportMode === 'master' ? '-master' : `-${exportMode}`;
      link.download = `bionic-hd-${Date.now()}${suffix}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      setIsExporting(false);
      showNotification("Download Started");
    }, 300);
  };

  const checkerboardStyle = {
    backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                      linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #ccc 75%), 
                      linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px 8px, 8px 0',
    backgroundColor: '#1a1f2e'
  };

  return (
    <div className="flex h-screen bg-[#060a14] text-slate-200 overflow-hidden font-sans selection:bg-[#ff6741] selection:text-white">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-[400px] flex-shrink-0 bg-[#0c1226] border-r border-white/5 flex flex-col z-30 shadow-2xl relative">
        <header className="px-6 py-6 border-b border-white/5 bg-[#182865] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Layers size={100} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-[#ff6741] rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-[10px] font-black tracking-[0.3em] text-[#ff6741] uppercase leading-none mb-1.5">Brand Toolkit</h1>
              <p className="text-lg font-black text-white tracking-tight">Bionic HD Gen 2</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Typography */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Type size={14} className="text-[#ff6741]" />
                <h2 className="text-[11px] font-bold uppercase tracking-widest">Headline System</h2>
              </div>
            </div>
            <div className="space-y-3">
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">01</span>
                <input 
                  type="text" 
                  value={text1} 
                  onChange={(e) => setText1(e.target.value.toUpperCase())} 
                  className="w-full pl-10 pr-4 py-4 bg-[#060a14] border border-white/5 focus:border-[#ff6741] rounded-xl text-sm font-black outline-none transition-all placeholder:text-slate-700 focus:ring-1 focus:ring-[#ff6741]" 
                  placeholder="LINE 1" 
                />
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">02</span>
                <input 
                  type="text" 
                  value={text2} 
                  onChange={(e) => setText2(e.target.value.toUpperCase())} 
                  className="w-full pl-10 pr-4 py-4 bg-[#060a14] border border-white/5 focus:border-[#ff6741] rounded-xl text-sm font-black outline-none transition-all placeholder:text-slate-700 focus:ring-1 focus:ring-[#ff6741]" 
                  placeholder="LINE 2" 
                />
              </div>
            </div>
            
            <div className={`bg-[#060a14] p-4 rounded-xl border ${isSpacingLocked ? 'border-white/5' : 'border-[#ff6741]/40'} space-y-4 transition-all duration-300 relative`}>
               {/* Header & Lock */}
               <div className="flex items-center justify-between border-b border-white/5 pb-3">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sizing & Spacing</span>
                      {!isSpacingLocked && (
                        <span className="text-[8px] font-medium text-[#ff6741] uppercase animate-pulse">Expert Mode Unlocked</span>
                      )}
                   </div>
                   
                   <div className="flex items-center gap-2">
                        {!isSpacingLocked && (
                            <button onClick={resetSpacing} className="text-slate-500 hover:text-white transition-colors" title="Reset Defaults">
                                <RotateCcw size={12} />
                            </button>
                        )}
                        <button 
                            onClick={() => setIsSpacingLocked(!isSpacingLocked)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${isSpacingLocked ? 'bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10' : 'bg-[#ff6741] text-white shadow-lg shadow-orange-900/40'}`}
                        >
                            {isSpacingLocked ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                   </div>
               </div>

               {/* Font Size (Always Editable) */}
               <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <span>Size</span>
                      <span>{fontSize}px</span>
                   </div>
                   <input 
                      type="range" 
                      min="40" 
                      max="200" 
                      value={fontSize} 
                      onChange={(e) => setFontSize(parseInt(e.target.value))} 
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff6741]" 
                    />
               </div>

               {/* Separator */}
               <div className="h-px bg-white/5" />

               {/* Word Spacing */}
               <div className={`space-y-2 transition-all duration-300 ${isSpacingLocked ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                   <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        <span>Word Spacing</span>
                        {wordSpacing < 0 && <AlertTriangle size={10} className="text-[#ff6741]" />}
                      </div>
                      <div className="flex items-center gap-2">
                         {/* Show brand default comparison when unlocked */}
                         {!isSpacingLocked && wordSpacing !== BRAND_DEFAULTS.word && (
                            <span className="text-[8px] text-slate-600">Default: {Math.round(BRAND_DEFAULTS.word * 100)}</span>
                         )}
                         <span className={wordSpacing < 0 ? 'text-[#ff6741]' : ''}>{Math.round(wordSpacing * 100)}</span>
                      </div>
                   </div>
                   {!isSpacingLocked && wordSpacing < 0 && (
                      <div className="text-[8px] text-[#ff6741] font-bold bg-[#ff6741]/10 px-2 py-1 rounded border border-[#ff6741]/20 flex items-center gap-1">
                          <AlertTriangle size={8} /> NEGATIVE SPACING DETECTED
                      </div>
                   )}
                   <input 
                      type="range" 
                      min="-0.5" 
                      max="1.5" 
                      step="0.05" 
                      value={wordSpacing} 
                      disabled={isSpacingLocked}
                      onChange={(e) => setWordSpacing(parseFloat(e.target.value))} 
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff6741]" 
                    />
               </div>

               {/* Letter Spacing */}
               <div className={`space-y-2 transition-all duration-300 ${isSpacingLocked ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                   <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        <span>Tracking</span>
                        {letterSpacing < 0 && <AlertTriangle size={10} className="text-[#ff6741]" />}
                      </div>
                      <div className="flex items-center gap-2">
                         {!isSpacingLocked && letterSpacing !== BRAND_DEFAULTS.letter && (
                            <span className="text-[8px] text-slate-600">Default: {Math.round(BRAND_DEFAULTS.letter * 100)}</span>
                         )}
                         <span className={letterSpacing < 0 ? 'text-[#ff6741]' : ''}>{Math.round(letterSpacing * 100)}</span>
                      </div>
                   </div>
                   {!isSpacingLocked && letterSpacing < 0 && (
                      <div className="text-[8px] text-[#ff6741] font-bold bg-[#ff6741]/10 px-2 py-1 rounded border border-[#ff6741]/20 flex items-center gap-1">
                          <AlertTriangle size={8} /> BRAND VIOLATION WARNING
                      </div>
                   )}
                   <input 
                      type="range" 
                      min="-0.1" 
                      max="0.5" 
                      step="0.01" 
                      value={letterSpacing} 
                      disabled={isSpacingLocked}
                      onChange={(e) => setLetterSpacing(parseFloat(e.target.value))} 
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff6741]" 
                    />
               </div>
            </div>
          </section>

          {/* Theme & Background */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Palette size={14} className="text-[#ff6741]" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest">Color System</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                {['primary', 'alt', 'blue', 'grey'].map(t => (
                  <button 
                    key={t} 
                    onClick={() => setTheme(t)} 
                    className={`
                      px-3 py-3 rounded-lg border text-[10px] font-black uppercase text-left transition-all flex items-center justify-between
                      ${theme === t ? 'border-[#ff6741] bg-[#ff6741]/10 text-white' : 'border-white/5 text-slate-500 bg-[#060a14] hover:border-white/20'}
                    `}
                  >
                    <span>{t}</span>
                    <div className="flex gap-1">
                      <div className={`w-2 h-2 rounded-full ${t === 'primary' ? 'bg-[#ff6741]' : t === 'alt' ? 'bg-[#182865]' : t === 'blue' ? 'bg-[#0a6bff]' : 'bg-[#f3f3f3]'}`} />
                      <div className={`w-2 h-2 rounded-full ${t === 'primary' ? 'bg-[#182865]' : t === 'alt' ? 'bg-[#ff6741]' : t === 'blue' ? 'bg-[#182865]' : 'bg-[#ffffff]'}`} />
                    </div>
                  </button>
                ))}
             </div>

             <div className="space-y-2">
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">Canvas Background</span>
               <div className="grid grid-cols-4 gap-2">
                {['white', 'navy', 'orange', 'transparent'].map(color => (
                  <button 
                    key={color} 
                    onClick={() => setCanvasBg(color)} 
                    className={`relative h-10 rounded-lg border transition-all flex items-center justify-center overflow-hidden
                      ${canvasBg === color ? 'border-[#ff6741] ring-1 ring-[#ff6741]' : 'border-white/5 hover:border-white/20'}`}
                  >
                    {color === 'transparent' ? (
                      <div className="w-full h-full opacity-50" style={checkerboardStyle} />
                    ) : (
                      <div className="w-full h-full" style={{ backgroundColor: BRAND.colors[color as keyof typeof BRAND.colors] }} />
                    )}
                    {canvasBg === color && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"><Check size={12} className="text-white drop-shadow-md" /></div>}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Layout Configuration */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Box size={14} className="text-[#ff6741]" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest">Layout Topology</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStyle('overlapping')} className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${style === 'overlapping' ? 'border-[#ff6741] bg-[#ff6741]/10 text-white' : 'border-white/5 text-slate-500 bg-[#060a14]'}`}>
                <Layers size={16} /><span className="text-[9px] font-black uppercase">Overlap</span>
              </button>
              <button onClick={() => setStyle('standard')} className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${style === 'standard' ? 'border-[#ff6741] bg-[#ff6741]/10 text-white' : 'border-white/5 text-slate-500 bg-[#060a14]'}`}>
                <Maximize size={16} /><span className="text-[9px] font-black uppercase">Standard</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setComposition('offset')} className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${composition === 'offset' ? 'border-[#182865] bg-[#182865]/50 text-white' : 'border-white/5 text-slate-500 bg-[#060a14]'}`}>
                <Move size={16} /><span className="text-[9px] font-black uppercase">Bionic Shift</span>
              </button>
              <button onClick={() => setComposition('range')} className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${composition === 'range' ? 'border-[#182865] bg-[#182865]/50 text-white' : 'border-white/5 text-slate-500 bg-[#060a14]'}`}>
                <AlignCenter size={16} /><span className="text-[9px] font-black uppercase">Centered</span>
              </button>
            </div>

            <div className="flex bg-[#060a14] p-1 rounded-lg border border-white/5">
              <button onClick={() => setStacking('box1')} className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all ${stacking === 'box1' ? 'bg-[#182865] text-white shadow-lg' : 'text-slate-500'}`}>BOX 1 TOP</button>
              <button onClick={() => setStacking('box2')} className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all ${stacking === 'box2' ? 'bg-[#182865] text-white shadow-lg' : 'text-slate-500'}`}>BOX 2 TOP</button>
            </div>
            
            <div className="flex bg-[#060a14] p-1 rounded-lg border border-white/5">
              {(['left', 'center', 'right'] as const).map(align => (
                <button key={align} onClick={() => setAlignment(align)} className={`flex-1 py-1.5 flex justify-center rounded-md transition-all ${alignment === align ? 'bg-white/10 text-[#ff6741]' : 'text-slate-500 hover:text-slate-300'}`}>
                  {align === 'left' ? <AlignLeft size={14} /> : align === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
                </button>
              ))}
            </div>
          </section>

          {/* View Options */}
          <section className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-[10px] font-bold uppercase">Frame Scale</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{Math.round(assetScale * 100)}%</span>
            </div>
            <input type="range" min="0.2" max="1.5" step="0.05" value={assetScale} onChange={(e) => setAssetScale(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-slate-500" />
            
            <button onClick={() => setShowGrid(!showGrid)} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${showGrid ? 'bg-white/10 border-[#ff6741] text-[#ff6741]' : 'bg-[#060a14] border-white/5 text-slate-600'}`}>
                <Grid size={14} /><span className="text-[10px] font-black uppercase">Toggle Layout Grid</span>
             </button>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 bg-[#080d1a] space-y-3 z-50">
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transparent Layers</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Master</span>
          </div>

          <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr] gap-2">
            
            {/* Layer 1 Export */}
            <button 
                disabled={isExporting} 
                onClick={() => exportAsset('layer1')} 
                className="group p-2 bg-[#182865] hover:bg-[#20337a] text-white rounded-xl shadow-lg border border-white/5 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 active:scale-95"
                title="Export Layer 1 Only"
            >
                <div className="font-black text-[12px]">1</div>
                <span className="text-[7px] font-bold uppercase opacity-50">Layer</span>
            </button>

            {/* Layer 2 Export */}
            <button 
                disabled={isExporting} 
                onClick={() => exportAsset('layer2')} 
                className="group p-2 bg-[#182865] hover:bg-[#20337a] text-white rounded-xl shadow-lg border border-white/5 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 active:scale-95"
                title="Export Layer 2 Only"
            >
                <div className="font-black text-[12px]">2</div>
                <span className="text-[7px] font-bold uppercase opacity-50">Layer</span>
            </button>

             {/* Combo Export */}
             <button 
                disabled={isExporting} 
                onClick={() => exportAsset('combo')} 
                className="group p-2 bg-[#182865] hover:bg-[#20337a] text-white rounded-xl shadow-lg border border-white/5 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 active:scale-95"
                title="Export Combined Layers"
            >
                <ImageIcon size={14} className="mb-0.5" />
                <span className="text-[7px] font-bold uppercase opacity-50">Combo</span>
            </button>

            {/* MASTER EXPORT (Full) */}
            <button 
                disabled={isExporting} 
                onClick={() => exportAsset('master')} 
                className="group py-2 bg-[#ff6741] hover:bg-[#ff7a5a] text-white rounded-xl shadow-lg shadow-orange-900/20 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 active:scale-95"
            >
                <Download size={16} />
                <span className="text-[9px] font-black uppercase">Master</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- PREVIEW STAGE --- */}
      <main className="flex-1 relative flex flex-col items-center justify-center bg-[#000000] overflow-hidden">
        
        {/* Stage Status */}
        <div className="absolute top-8 left-8 flex gap-4 pointer-events-none z-40">
           <div className="bg-[#0c1226]/90 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-[#30b64a] shadow-[0_0_10px_#30b64a]" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">HD Live Preview</span>
           </div>
        </div>

        {/* Workspace Frame */}
        <div 
          className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out border border-white/5"
          style={{ 
            width: '1920px', 
            height: '1080px', 
            transform: `scale(${Math.min(0.6, (window.innerWidth - 450) / 1920) * assetScale})`,
            backgroundColor: canvasBg === 'transparent' ? 'transparent' : (BRAND.colors[canvasBg as keyof typeof BRAND.colors] || 'white'),
            ...(canvasBg === 'transparent' ? checkerboardStyle : {}),
            cursor: 'default'
          }}
        >
          {/* Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 z-10 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(#ff6741 1px, transparent 1px), linear-gradient(90deg, #ff6741 1px, transparent 1px)`, backgroundSize: '100px 100px' }}>
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#ff6741] scale-y-[2]" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#ff6741] scale-x-[2]" />
            </div>
          )}

          <div className="w-full h-full relative flex items-center justify-center">
            {/* Headline Group */}
            <div 
              className="relative flex flex-col z-20"
              style={{ 
                alignItems: alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
                justifyContent: 'center',
                gap: 0
              }}
            >
              
              {/* Line 1 */}
              <div 
                className="relative transition-all duration-500 ease-out"
                style={{ 
                  zIndex: stacking === 'box1' ? 40 : 20,
                  transform: `rotate(${BRAND.metrics.angle}deg)`,
                  transformOrigin: 'center'
                }}
              >
                <div 
                  className="px-0 flex items-center justify-center font-[Poppins] font-[900] whitespace-nowrap shadow-2xl"
                  style={{ 
                    background: getThemeColors(1).bg, 
                    color: getThemeColors(1).text,
                    height: `${totalBoxHeight}px`,
                    fontSize: `${fontSize}px`,
                    // Calculate padding manually to match canvas
                    paddingLeft: `${brandPadding}px`,
                    paddingRight: `${brandPadding}px`,
                    // Fix optical vertical alignment for Poppins
                    lineHeight: 1, 
                    paddingTop: `${fontSize * 0.05}px`,
                    letterSpacing: `${letterSpacing}em`,
                    wordSpacing: `${wordSpacing}em`
                  }}
                >
                  {text1 || ' '}
                </div>
              </div>

              {/* Line 2 */}
              <div 
                className="relative transition-all duration-500 ease-out"
                style={{ 
                  zIndex: stacking === 'box2' ? 40 : 20,
                  marginTop: `${boxStackOffset}px`, // This is the Gap
                  transform: `rotate(-${BRAND.metrics.angle}deg) translateX(${horizontalShift}px)`,
                  transformOrigin: 'center'
                }}
              >
                <div 
                  className="px-0 flex items-center justify-center font-[Poppins] font-[900] whitespace-nowrap shadow-2xl"
                  style={{ 
                    background: getThemeColors(2).bg, 
                    color: getThemeColors(2).text,
                    height: `${totalBoxHeight}px`,
                    fontSize: `${fontSize}px`,
                    paddingLeft: `${brandPadding}px`,
                    paddingRight: `${brandPadding}px`,
                    lineHeight: 1, 
                    paddingTop: `${fontSize * 0.05}px`,
                    letterSpacing: `${letterSpacing}em`,
                    wordSpacing: `${wordSpacing}em`
                  }}
                >
                  {text2 || ' '}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-12 right-12 bg-[#ff6741] text-white px-8 py-4 rounded-xl shadow-2xl text-xs font-black flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-300 z-50 uppercase tracking-wide">
            <Check size={16} className="text-white" /> {toast}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;