
import React, { useState } from 'react';
import { GameRecord, PicaDuel } from '../types';
import { ArrowLeft, Tent, MessageSquare, Trophy, Target, Zap, ChevronDown, ChevronUp, Users, History, BarChart3, Medal, Calendar } from 'lucide-react';

interface LeaderboardProps {
  history: GameRecord[];
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ history, onBack }) => {
  const [activeTab, setActiveTab] = useState<'EQUIPOS' | 'HISTORIAL' | 'PICA'>('EQUIPOS');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  const getTeamRankings = () => {
    const stats: Record<string, { wins: number, games: number, totalPoints: number }> = {};
    
    history.forEach(game => {
      [game.team1Name, game.team2Name].forEach(name => {
        if (!stats[name]) stats[name] = { wins: 0, games: 0, totalPoints: 0 };
        stats[name].games += 1;
      });
      
      const winner = game.winnerName;
      stats[winner].wins += 1;
      stats[game.team1Name].totalPoints += game.score1;
      stats[game.team2Name].totalPoints += game.score2;
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      ...data,
      winRate: (data.wins / data.games) * 100
    })).sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
  };

  const getPicaStats = () => {
    const stats: Record<string, { points: number, wins: number, duels: number, maxInOne: number }> = {};

    history.forEach(game => {
      if (!game.picaHistory) return;
      game.picaHistory.forEach(round => {
        round.forEach(duel => {
          [ {n: duel.p1, s: duel.s1, o: duel.s2}, {n: duel.p2, s: duel.s2, o: duel.s1} ].forEach(p => {
            if (!stats[p.n]) stats[p.n] = { points: 0, wins: 0, duels: 0, maxInOne: 0 };
            stats[p.n].points += p.s;
            stats[p.n].duels += 1;
            stats[p.n].wins += p.s > p.o ? 1 : 0;
            stats[p.n].maxInOne = Math.max(stats[p.n].maxInOne, p.s);
          });
        });
      });
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      ...data,
      winRate: data.duels > 0 ? (data.wins / data.duels) * 100 : 0
    })).sort((a, b) => b.points - a.points);
  };

  const teamRankings = getTeamRankings();
  const picaRankings = getPicaStats();
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

  return (
    <div className="w-full max-w-lg mx-auto py-6 animate-in fade-in duration-500 px-4 pb-24">
      <header className="flex flex-col gap-8 mb-10">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-3.5 bg-white/5 rounded-2xl text-gray-500 hover:text-white active:scale-90 transition-all">
            <ArrowLeft size={22} />
          </button>
          <div className="text-right">
            <h2 className="text-3xl font-black tracking-tighter uppercase text-emerald-500 italic">STATS</h2>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mt-1">{history.length} Partidas Guardadas</p>
          </div>
        </div>

        <div className="flex bg-white/[0.03] p-1.5 rounded-[22px] border border-white/5">
          <button 
            onClick={() => setActiveTab('EQUIPOS')} 
            className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'EQUIPOS' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-600 hover:text-gray-400'}`}
          >
            <Users size={16} /> Equipos
          </button>
          <button 
            onClick={() => setActiveTab('HISTORIAL')} 
            className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORIAL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-600 hover:text-gray-400'}`}
          >
            <History size={16} /> Juegos
          </button>
          <button 
            onClick={() => setActiveTab('PICA')} 
            className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'PICA' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
          >
            <Zap size={16} /> Pica
          </button>
        </div>
      </header>

      {/* EQUIPOS */}
      {activeTab === 'EQUIPOS' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-6 duration-500">
          {teamRankings.length > 0 ? (
            teamRankings.map((team, i) => (
              <div key={team.name} className={`app-card relative overflow-hidden group transition-all duration-300 border-white/5 ${i === 0 ? 'bg-emerald-500/[0.03] border-emerald-500/20 neon-emerald' : ''}`}>
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg italic ${i === 0 ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/30' : 'bg-white/5 text-gray-600'}`}>
                      {i < 3 ? <Medal size={22} /> : i + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-white uppercase tracking-tight italic truncate leading-tight">{team.name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{team.games} PARTIDAS</span>
                        <div className="w-1 h-1 bg-white/5 rounded-full" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{team.winRate.toFixed(0)}% WR</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-white italic tabular-nums leading-none">{team.wins}</div>
                    <div className="text-[9px] font-black text-gray-700 uppercase tracking-widest mt-2">Win</div>
                  </div>
                </div>
                <div className="h-1 w-full bg-white/5">
                  <div className="h-full bg-emerald-500/40" style={{ width: `${team.winRate}%` }} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState message="No hay partidas terminadas" icon={<Users size={48} />} />
          )}
        </div>
      )}

      {/* HISTORIAL */}
      {activeTab === 'HISTORIAL' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
          {history.length > 0 ? (
            history.sort((a, b) => b.timestamp - a.timestamp).map((game) => (
              <div key={game.id} className="app-card border-white/5 group overflow-hidden">
                <div className="bg-white/[0.02] px-5 py-3 flex justify-between items-center border-b border-white/5">
                   <div className="flex items-center gap-2.5">
                     <Calendar size={12} className="text-gray-600" />
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{formatDate(game.timestamp)}</span>
                   </div>
                   <div className="flex gap-2.5">
                     {game.picaHistory && game.picaHistory.length > 0 && <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-3 py-1 rounded-full border border-amber-500/20 italic">3v3 PICA</span>}
                     <span className="bg-white/5 text-gray-500 text-[9px] font-black px-3 py-1 rounded-full border border-white/5 italic">A {game.maxPoints}</span>
                   </div>
                </div>
                
                <div className="p-6 grid grid-cols-[1fr_auto_1fr] items-center gap-8">
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <p className={`text-[11px] font-black uppercase tracking-tight truncate italic ${game.winnerName === game.team1Name ? 'text-blue-500' : 'text-gray-700'}`}>{game.team1Name}</p>
                      {game.team1Name !== game.winnerName && game.duermeAfuera && <Tent size={12} className="text-emerald-500 shrink-0" />}
                    </div>
                    <p className={`text-5xl font-black italic tabular-nums leading-none ${game.winnerName === game.team1Name ? 'text-white' : 'text-white/10'}`}>{game.score1}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-px bg-white/10" />
                    <span className="text-[10px] font-black text-gray-800 italic my-2">VS</span>
                    <div className="h-8 w-px bg-white/10" />
                  </div>
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <p className={`text-[11px] font-black uppercase tracking-tight truncate italic ${game.winnerName === game.team2Name ? 'text-rose-500' : 'text-gray-700'}`}>{game.team2Name}</p>
                      {game.team2Name !== game.winnerName && game.duermeAfuera && <Tent size={12} className="text-emerald-500 shrink-0" />}
                    </div>
                    <p className={`text-5xl font-black italic tabular-nums leading-none ${game.winnerName === game.team2Name ? 'text-white' : 'text-white/10'}`}>{game.score2}</p>
                  </div>
                </div>

                {(game.notes || (game.picaHistory && game.picaHistory.length > 0)) && (
                  <div className="px-5 pb-5 space-y-4">
                    {game.notes && (
                      <div className="flex items-start gap-3 bg-white/[0.02] p-4 rounded-[20px] border border-white/5">
                        <MessageSquare size={14} className="text-gray-600 mt-1 shrink-0" />
                        <p className="text-[12px] text-gray-400 italic leading-relaxed font-medium">"{game.notes}"</p>
                      </div>
                    )}
                    
                    {game.picaHistory && game.picaHistory.length > 0 && (
                      <div>
                        <button 
                          onClick={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                          className="w-full py-3.5 bg-white/5 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-center gap-3 active:bg-white/10 transition-all italic"
                        >
                          {expandedGame === game.id ? <><ChevronUp size={16} /> Ocultar Duelos</> : <><ChevronDown size={16} /> Ver Detalles Pica</>}
                        </button>
                        {expandedGame === game.id && (
                          <div className="mt-3 space-y-2.5 animate-in fade-in slide-in-from-top-4 duration-400">
                            {game.picaHistory.map((round, rIdx) => (
                              <div key={rIdx} className="p-4 bg-amber-500/[0.03] rounded-[22px] border border-amber-500/10 space-y-3">
                                <p className="text-[9px] font-black text-amber-500/50 uppercase tracking-[0.3em] italic">Mano {rIdx + 1}</p>
                                {round.map((duel, dIdx) => (
                                  <div key={dIdx} className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="flex-1 truncate text-gray-500 uppercase italic">{duel.p1}</span>
                                    <span className="px-5 text-white tabular-nums font-black text-sm italic">{duel.s1} - {duel.s2}</span>
                                    <span className="flex-1 truncate text-right text-gray-500 uppercase italic">{duel.p2}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <EmptyState message="Historial vacío" icon={<History size={48} />} />
          )}
        </div>
      )}

      {/* PICA INDIVIDUAL */}
      {activeTab === 'PICA' && (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
          {picaRankings.length > 0 ? (
            <>
              <div className="app-card bg-amber-500 text-black p-8 rounded-[32px] flex items-center justify-between shadow-2xl shadow-amber-500/20 relative overflow-hidden italic">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={100} fill="currentColor" /></div>
                <div className="relative z-10">
                  <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Trophy size={16} /> Rey del Pica
                  </h3>
                  <p className="text-3xl font-black uppercase truncate max-w-[180px] tracking-tight">{picaRankings[0].name}</p>
                </div>
                <div className="text-right relative z-10">
                  <div className="text-5xl font-black tabular-nums leading-none">{picaRankings[0].points}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">Puntos</div>
                </div>
              </div>

              <div className="app-card border-white/5 overflow-hidden">
                <div className="px-6 py-4 bg-white/[0.02] flex justify-between items-center border-b border-white/5">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Ranking Individual</span>
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Stats</span>
                </div>
                <div className="divide-y divide-white/5">
                  {picaRankings.map((p, i) => (
                    <div key={p.name} className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-gray-800 italic w-5">#{i+1}</span>
                        <span className="text-sm font-black text-white uppercase italic truncate max-w-[140px] tracking-tight">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-lg font-black text-white italic tabular-nums leading-none">{p.points}</div>
                          <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic">{p.winRate.toFixed(0)}% WR</div>
                        </div>
                        <div className="bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 min-w-[40px] text-center italic shadow-inner">
                          <span className="text-xs font-black text-amber-500 tabular-nums">{p.maxInOne}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="app-card p-6 flex flex-col items-center gap-3 border-white/5 italic">
                  <Target size={20} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Efectividad</span>
                  <span className="text-sm font-black text-white uppercase truncate w-full text-center tracking-tight">
                    {picaRankings.sort((a,b) => b.winRate - a.winRate)[0].name}
                  </span>
                </div>
                <div className="app-card p-6 flex flex-col items-center gap-3 border-white/5 italic">
                  <BarChart3 size={20} className="text-blue-500" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Combatividad</span>
                  <span className="text-sm font-black text-white uppercase truncate w-full text-center tracking-tight">
                    {picaRankings.sort((a,b) => b.duels - a.duels)[0].name}
                  </span>
                </div>
              </div>
            </>
          ) : (
             <EmptyState message="Falta jugar Pica a Pica" icon={<Zap size={48} />} />
          )}
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ message: string, icon: React.ReactNode }> = ({ message, icon }) => (
  <div className="py-24 flex flex-col items-center justify-center text-center px-10 border-2 border-dashed border-white/5 rounded-[40px] opacity-20">
    <div className="mb-6 text-white">{icon}</div>
    <p className="text-[11px] font-black text-white uppercase tracking-[0.4em] leading-relaxed max-w-[200px] italic">
      {message}
    </p>
  </div>
);

export default Leaderboard;
