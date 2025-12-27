
import React, { useState, useEffect } from 'react';
import { Team, PicaDuel, Player } from '../types';
import Fosforos from './Fosforos';
import { Plus, Minus, Home, RotateCcw, Trophy, Tent, ChevronRight, Zap, X, Check, Repeat, RefreshCw, Undo2 } from 'lucide-react';

interface ScoreBoardProps {
  team1: Team;
  team2: Team;
  score1: number;
  score2: number;
  maxPoints: number;
  players: Player[];
  onUpdateScore: (teamIndex: 1 | 2, delta: number, setPicaNext?: boolean) => void;
  onUpdatePicaHistory: (duels: PicaDuel[]) => void;
  onReset: () => void;
  onHome: () => void;
  onFinish: (notes: string, duermeAfuera: boolean) => void;
  onRematch: (notes: string, duermeAfuera: boolean) => void;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({
  team1: initialTeam1, team2: initialTeam2, score1, score2, maxPoints, players, onUpdateScore, onUpdatePicaHistory, onReset, onHome, onFinish, onRematch
}) => {
  // Helper para obtener nombre de jugador por ID
  const getPlayerName = (playerId: string) => players.find(p => p.id === playerId)?.name || 'Desconocido';
  const getTeamPlayerNames = (team: Team) => team.playerIds.map(id => getPlayerName(id)).join(' · ');

  const isGameOver = score1 >= maxPoints || score2 >= maxPoints;
  const [notes, setNotes] = useState('');
  const [isDuermeAfuera, setIsDuermeAfuera] = useState(false);
  const [localTeam2, setLocalTeam2] = useState<Team>(initialTeam2);
  
  const [handScore1, setHandScore1] = useState(0);
  const [handScore2, setHandScore2] = useState(0);

  const is3v3 = initialTeam1.playerIds.length === 3 && initialTeam2.playerIds.length === 3;
  const [lastHandWasPica, setLastHandWasPica] = useState(false);
  
  const isPicaRange = is3v3 && (score1 >= 5 || score2 >= 5) && (score1 < 25 && score2 < 25);
  const isPicaTurn = isPicaRange && !lastHandWasPica;

  const [showPicaPicaModal, setShowPicaPicaModal] = useState(false);
  const [picaMatchScores, setPicaMatchScores] = useState<[number, number][]>([[0,0], [0,0], [0,0]]);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  
  // Estado para undo de última mano
  const [lastAction, setLastAction] = useState<{
    delta1: number;
    delta2: number;
    wasPica: boolean;
  } | null>(null);

  // Determinar perdedor
  const loserName = score1 >= maxPoints ? initialTeam2.name : initialTeam1.name;

  // Efecto para calcular automáticamente el "Duerme Afuera" al terminar la partida
  useEffect(() => {
    if (isGameOver) {
      const loserScore = Math.min(score1, score2);
      // Regla: si el perdedor queda en menos de 15 puntos (las "malas" en un juego a 30)
      if (loserScore < 15) {
        setIsDuermeAfuera(true);
      } else {
        setIsDuermeAfuera(false);
      }
    }
  }, [isGameOver, score1, score2]);

  const confirmRedonda = () => {
    if (isGameOver) return;
    // Guardar la acción para poder deshacer
    setLastAction({ delta1: handScore1, delta2: handScore2, wasPica: false });
    onUpdateScore(1, handScore1);
    onUpdateScore(2, handScore2);
    setLastHandWasPica(false);
    setHandScore1(0);
    setHandScore2(0);
  };

  const handlePicaPicaSubmit = () => {
    const roundDuels: PicaDuel[] = picaMatchScores.map((scores, idx) => ({
      p1Id: initialTeam1.playerIds[idx],
      p2Id: localTeam2.playerIds[idx],
      s1: scores[0],
      s2: scores[1]
    }));

    // Guardar en Firestore via App.tsx (se persiste automaticamente)
    onUpdatePicaHistory(roundDuels);
    
    const totalT1 = picaMatchScores.reduce((acc, curr) => acc + curr[0], 0);
    const totalT2 = picaMatchScores.reduce((acc, curr) => acc + curr[1], 0);
    const diff = totalT1 - totalT2;
    
    // Guardar la acción para poder deshacer
    const delta1 = diff > 0 ? diff : 0;
    const delta2 = diff < 0 ? Math.abs(diff) : 0;
    setLastAction({ delta1, delta2, wasPica: true });
    
    if (diff > 0) onUpdateScore(1, diff);
    else if (diff < 0) onUpdateScore(2, Math.abs(diff));
    
    setLastHandWasPica(true);
    setShowPicaPicaModal(false);
    setPicaMatchScores([[0,0], [0,0], [0,0]]);
  };

  const handleUndo = () => {
    if (!lastAction) return;
    // Restar los puntos agregados
    if (lastAction.delta1 > 0) onUpdateScore(1, -lastAction.delta1);
    if (lastAction.delta2 > 0) onUpdateScore(2, -lastAction.delta2);
    // Restaurar estado de pica si corresponde
    if (lastAction.wasPica) setLastHandWasPica(false);
    setLastAction(null);
  };

  const updatePicaScore = (matchIdx: number, teamIdx: 0 | 1, delta: number) => {
    const newScores = [...picaMatchScores] as [number, number][];
    newScores[matchIdx][teamIdx] = Math.max(0, newScores[matchIdx][teamIdx] + delta);
    setPicaMatchScores(newScores);
  };

  const handleSwapLocalPlayer = (idx: number) => {
    if (swapIndex === null) {
      setSwapIndex(idx);
    } else if (swapIndex === idx) {
      setSwapIndex(null);
    } else {
      const newPlayerIds = [...localTeam2.playerIds];
      const temp = newPlayerIds[swapIndex];
      newPlayerIds[swapIndex] = newPlayerIds[idx];
      newPlayerIds[idx] = temp;

      const newScores = [...picaMatchScores] as [number, number][];
      const tempScore = newScores[swapIndex];
      newScores[swapIndex] = newScores[idx];
      newScores[idx] = tempScore;

      setLocalTeam2({ ...localTeam2, playerIds: newPlayerIds });
      setPicaMatchScores(newScores);
      setSwapIndex(null);
    }
  };

  const picaNetDiff = picaMatchScores.reduce((a,c) => a + (c[0]-c[1]), 0);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#05070a] safe-area-inset overflow-hidden">
      <style>{`
        .pica-glow { animation: pica-pulse 3s infinite ease-in-out; }
        @keyframes pica-pulse {
          0% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.1); }
          50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.4); border-color: rgba(245, 158, 11, 0.6); }
          100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.1); }
        }
        .score-row-pica { background: linear-gradient(90deg, rgba(59, 130, 246, 0.03) 0%, rgba(244, 63, 94, 0.03) 100%); }
        .score-val { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>

      {/* Main Header */}
      <header className="flex items-center justify-between px-6 py-4 glass border-b border-white/5 z-10 shrink-0">
        <button onClick={onHome} className="p-2.5 bg-white/5 rounded-2xl text-gray-500 active:scale-90 transition-all"><Home size={20} /></button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">TRUCO</span>
          <div className="flex items-center gap-1.5 mt-0.5">
             <div className={`w-1.5 h-1.5 rounded-full ${isPicaTurn ? 'bg-amber-500 animate-pulse' : 'bg-emerald-900'}`}></div>
             <span className={`text-[8px] font-black uppercase tracking-widest ${isPicaTurn ? 'text-amber-500' : 'text-gray-700'}`}>
               {isPicaTurn ? 'PICA A PICA' : 'REDONDA'}
             </span>
          </div>
        </div>
        <button onClick={onReset} className="p-2.5 bg-white/5 rounded-2xl text-gray-500 active:scale-90 transition-all"><RotateCcw size={20} /></button>
      </header>

      {/* Main Scoring Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 grid grid-cols-2 overflow-hidden">
          {/* NOSOTROS */}
          <div className={`flex flex-col items-center justify-center border-r border-white/5 p-4 transition-all duration-700 ${score1 >= maxPoints ? 'bg-blue-500/10' : ''}`}>
             <div className="mb-4 text-center w-full px-2">
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">{initialTeam1.name}</span>
               <span className="text-[8px] font-bold text-gray-600 uppercase tracking-wider block mb-3 truncate">
                 {getTeamPlayerNames(initialTeam1)}
               </span>
               <div className="text-7xl sm:text-8xl font-black text-white tracking-tighter tabular-nums score-val leading-none italic">
                 {Math.min(score1 + handScore1, maxPoints)}
               </div>
               <div className="h-4 mt-1">
                 {handScore1 > 0 && <span className="text-blue-400 text-xs font-black animate-pulse">+{handScore1}</span>}
               </div>
             </div>
             <div className="scale-75 sm:scale-90">
               <Fosforos points={Math.min(score1 + handScore1, maxPoints)} colorClass="bg-blue-500" />
             </div>
          </div>

          {/* ELLOS */}
          <div className={`flex flex-col items-center justify-center p-4 transition-all duration-700 ${score2 >= maxPoints ? 'bg-rose-500/10' : ''}`}>
             <div className="mb-4 text-center w-full px-2">
               <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">{initialTeam2.name}</span>
               <span className="text-[8px] font-bold text-gray-600 uppercase tracking-wider block mb-3 truncate">
                 {getTeamPlayerNames(initialTeam2)}
               </span>
               <div className="text-7xl sm:text-8xl font-black text-white tracking-tighter tabular-nums score-val leading-none italic">
                 {Math.min(score2 + handScore2, maxPoints)}
               </div>
               <div className="h-4 mt-1">
                 {handScore2 > 0 && <span className="text-rose-400 text-xs font-black animate-pulse">+{handScore2}</span>}
               </div>
             </div>
             <div className="scale-75 sm:scale-90">
               <Fosforos points={Math.min(score2 + handScore2, maxPoints)} colorClass="bg-rose-500" />
             </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="bg-[#080a0f] border-t border-white/5 p-5 pb-10 shadow-[0_-15px_50px_rgba(0,0,0,0.6)] shrink-0">
          {!isPicaTurn ? (
            <div className="flex items-center justify-between max-w-md mx-auto gap-4">
              <div className="flex flex-col gap-3">
                <button onClick={() => setHandScore1(p => p + 1)} className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"><Plus size={28} strokeWidth={3} /></button>
                <button onClick={() => setHandScore1(p => Math.max(0, p - 1))} className="w-14 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-600 active:bg-white/10"><Minus size={20} strokeWidth={3} /></button>
              </div>

              <div className="flex flex-col items-center gap-2 relative">
                {lastAction && (
                  <button 
                    onClick={handleUndo}
                    className="absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all animate-in fade-in slide-in-from-bottom-2"
                  >
                    <Undo2 size={14} /> Deshacer
                  </button>
                )}
                <button 
                  onClick={confirmRedonda}
                  disabled={isGameOver || (handScore1 === 0 && handScore2 === 0)}
                  className="w-20 h-20 rounded-full bg-emerald-500 border-4 border-emerald-400 flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-5 shadow-2xl"
                >
                  <Check size={40} className="text-black" strokeWidth={4} />
                </button>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500/40">Confirmar</span>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={() => setHandScore2(p => p + 1)} className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"><Plus size={28} strokeWidth={3} /></button>
                <button onClick={() => setHandScore2(p => Math.max(0, p - 1))} className="w-14 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-600 active:bg-white/10"><Minus size={20} strokeWidth={3} /></button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto animate-in slide-in-from-bottom-6">
              <button 
                onClick={() => setShowPicaPicaModal(true)}
                className="w-full py-7 bg-amber-500 text-black font-black uppercase tracking-[0.4em] rounded-[28px] shadow-[0_15px_40px_rgba(245,158,11,0.2)] pica-glow flex items-center justify-center gap-3 active:scale-95 transition-transform italic"
              >
                <Zap size={24} fill="currentColor" /> INICIAR PICA A PICA
              </button>
              <p className="text-[9px] font-black text-amber-500/30 uppercase tracking-[0.4em] text-center italic">Duelos individuales obligatorios</p>
            </div>
          )}
        </div>
      </div>

      {/* PICA A PICA MODAL - ULTRA COMPACT SINGLE PAGE */}
      {showPicaPicaModal && (
        <div className="fixed inset-0 bg-[#05070a] z-[60] flex flex-col animate-in fade-in duration-300">
          <header className="p-4 flex justify-between items-center border-b border-white/5 bg-amber-500/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 rounded-xl text-black"><Zap size={18} fill="currentColor" /></div>
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Duelos Pica</h3>
                <p className="text-[8px] font-black text-amber-500/50 uppercase tracking-[0.2em] mt-1">Resultados por silla</p>
              </div>
            </div>
            <button onClick={() => setShowPicaPicaModal(false)} className="p-2.5 bg-white/5 rounded-full text-gray-500 active:scale-90 transition-all"><X size={20} /></button>
          </header>

          <div className="flex-1 flex flex-col px-3 py-2 space-y-1.5 overflow-hidden">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex-1 score-row-pica border border-white/5 rounded-[28px] p-3 flex flex-col justify-between animate-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 100}ms` }}>
                {/* Names Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[7px] font-black text-blue-500 uppercase opacity-40 mb-0.5 tracking-widest">Nosotros</p>
                    <p className="text-sm font-black text-white truncate leading-tight uppercase italic">{getPlayerName(initialTeam1.playerIds[idx])}</p>
                  </div>
                  
                  <div className="mx-3 text-[9px] font-black text-white/5 italic uppercase shrink-0">vs</div>
                  
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[7px] font-black text-rose-500 uppercase opacity-40 mb-0.5 tracking-widest flex items-center justify-end gap-1">
                      Ellos <Repeat size={8} />
                    </p>
                    <button
                      onClick={() => handleSwapLocalPlayer(idx)}
                      className={`text-sm font-black text-right truncate leading-tight uppercase italic transition-all ${swapIndex === idx ? 'text-amber-500 underline underline-offset-4 decoration-amber-500/50' : 'text-white'}`}
                    >
                      {getPlayerName(localTeam2.playerIds[idx])}
                    </button>
                  </div>
                </div>

                {/* Score Controls */}
                <div className="flex items-center justify-between gap-3 mt-1">
                  <div className="flex-1 flex items-center justify-between bg-white/[0.02] p-1 rounded-2xl border border-white/5">
                    <button onClick={() => updatePicaScore(idx, 0, -1)} className="flex-1 flex justify-center py-3 bg-white/5 rounded-xl text-gray-700 active:scale-95 transition-all"><Minus size={18} /></button>
                    <div className="w-12 text-3xl font-black text-blue-500 text-center tabular-nums italic leading-none">{picaMatchScores[idx][0]}</div>
                    <button onClick={() => updatePicaScore(idx, 0, 1)} className="flex-1 flex justify-center py-3 bg-blue-600 rounded-xl text-white shadow-lg active:scale-95 transition-all"><Plus size={18} strokeWidth={3} /></button>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-between bg-white/[0.02] p-1 rounded-2xl border border-white/5">
                    <button onClick={() => updatePicaScore(idx, 1, 1)} className="flex-1 flex justify-center py-3 bg-rose-600 rounded-xl text-white shadow-lg active:scale-95 transition-all"><Plus size={18} strokeWidth={3} /></button>
                    <div className="w-12 text-3xl font-black text-rose-500 text-center tabular-nums italic leading-none">{picaMatchScores[idx][1]}</div>
                    <button onClick={() => updatePicaScore(idx, 1, -1)} className="flex-1 flex justify-center py-3 bg-white/5 rounded-xl text-gray-700 active:scale-95 transition-all"><Minus size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fixed Footer for Modal */}
          <div className="p-5 border-t border-white/5 glass space-y-4 shrink-0 pb-8">
             <div className="flex justify-between items-end px-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Diferencia</span>
                  <div className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                    {picaNetDiff === 0 ? <span className="text-gray-400">EMPATE</span> : 
                     picaNetDiff > 0 ? <span className="text-blue-500">+{picaNetDiff} NOS</span> :
                     <span className="text-rose-500">+{Math.abs(picaNetDiff)} ELLOS</span>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-white/5 uppercase tracking-widest italic">Tanto</span>
                  <div className="text-xl font-black text-white/10 tabular-nums leading-none">
                    {picaMatchScores.reduce((a,c)=>a+c[0],0)} - {picaMatchScores.reduce((a,c)=>a+c[1],0)}
                  </div>
                </div>
             </div>
             <button onClick={handlePicaPicaSubmit} className="w-full py-6 bg-emerald-500 text-black font-black uppercase tracking-[0.4em] rounded-[28px] shadow-2xl active:scale-95 text-xs flex items-center justify-center gap-3 italic">
               CONFIRMAR PUNTOS <Check size={20} strokeWidth={4} />
             </button>
          </div>
        </div>
      )}

      {/* GameOver Modal */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-start z-[70] p-6 animate-in fade-in duration-500 pt-10 overflow-y-auto">
          <div className="w-full max-w-sm text-center space-y-8 pb-20">
            <div className="flex flex-col items-center gap-6">
              <div className="bg-emerald-500/20 p-8 rounded-full ring-[16px] ring-emerald-500/5 animate-pulse">
                <Trophy size={60} className="text-emerald-500" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.6em] italic">VICTORIA</p>
                <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-tight">
                  {score1 >= maxPoints ? initialTeam1.name : initialTeam2.name}
                </h2>
              </div>
            </div>
            
            <div className="text-7xl font-black text-white tracking-tighter tabular-nums py-8 border-y border-white/5 italic">
              {Math.max(score1, score2)}<span className="text-gray-800 text-4xl mx-3">/</span>{Math.min(score1, score2)}
            </div>

            {/* Mensaje Automático Duerme Afuera */}
            {isDuermeAfuera && (
              <div className="flex flex-col items-center animate-in zoom-in duration-500">
                <div className="bg-emerald-500 text-black px-8 py-4 rounded-[22px] shadow-[0_15px_40px_rgba(16,185,129,0.3)] flex items-center gap-3">
                  <Tent size={20} fill="currentColor" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">
                    {loserName} DUERME AFUERA
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4 text-left">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] px-2 italic">Comentario Final</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="¿Cómo terminó esto?..." 
                className="w-full bg-white/[0.03] border border-white/10 rounded-[28px] p-6 text-sm text-white placeholder:text-gray-800 outline-none min-h-[100px] resize-none focus:border-emerald-500/50 transition-all font-medium italic" 
              />
            </div>

            <div className="pt-4 space-y-4">
              <button 
                onClick={() => onRematch(notes, isDuermeAfuera)} 
                className="w-full py-6 bg-blue-600 text-white font-black uppercase tracking-[0.4em] rounded-[28px] active:scale-95 shadow-[0_15px_40px_rgba(37,99,235,0.3)] text-xs flex items-center justify-center gap-3 italic"
              >
                REVANCHA <RefreshCw size={20} strokeWidth={3} />
              </button>
              <button onClick={() => onFinish(notes, isDuermeAfuera)} className="w-full py-6 bg-emerald-500 text-black font-black uppercase tracking-[0.4em] rounded-[28px] active:scale-95 shadow-2xl text-xs flex items-center justify-center gap-3 italic">
                CERRAR PARTIDA <ChevronRight size={20} strokeWidth={3} />
              </button>
              <button onClick={onReset} className="w-full py-3 text-[10px] font-black text-gray-800 uppercase tracking-[0.4em] hover:text-rose-500 transition-colors italic">DESCARTAR REGISTRO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;
