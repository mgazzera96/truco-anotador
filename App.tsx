
import React, { useState, useEffect } from 'react';
import { Team, GameView, GameRecord, PicaDuel } from './types';
import TeamSetup from './components/TeamSetup';
import ScoreBoard from './components/ScoreBoard';
import Leaderboard from './components/Leaderboard';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const DEFAULT_TEAMS: Team[] = [
  { id: 'team-1', name: 'Nosotros', players: ['Jugador 1', 'Jugador 2', 'Jugador 3'], wins: 0 },
  { id: 'team-2', name: 'Ellos', players: ['Rival 1', 'Rival 2', 'Rival 3'], wins: 0 }
];

const App: React.FC = () => {
  const [view, setView] = useState<GameView>(GameView.SETUP);
  const [loading, setLoading] = useState(true);
  
  const [teams, setTeams] = useState<Team[]>(DEFAULT_TEAMS);
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [currentGame, setCurrentGame] = useState<{
    team1: Team;
    team2: Team;
    score1: number;
    score2: number;
    maxPoints: 15 | 30;
    nextHandIsPica: boolean;
    picaHistory: PicaDuel[][];
  } | null>(null);

  // Cargar datos desde Firestore al iniciar
  useEffect(() => {
    const unsubTeams = onSnapshot(doc(db, 'config', 'teams'), (snapshot) => {
      if (snapshot.exists()) {
        setTeams(snapshot.data().list || DEFAULT_TEAMS);
      }
      setLoading(false);
    });

    const unsubHistory = onSnapshot(doc(db, 'config', 'history'), (snapshot) => {
      if (snapshot.exists()) {
        setHistory(snapshot.data().list || []);
      }
    });

    const unsubCurrentGame = onSnapshot(doc(db, 'config', 'currentGame'), (snapshot) => {
      if (snapshot.exists() && snapshot.data().game) {
        setCurrentGame(snapshot.data().game);
      } else {
        setCurrentGame(null);
      }
    });

    return () => {
      unsubTeams();
      unsubHistory();
      unsubCurrentGame();
    };
  }, []);

  // Guardar teams en Firestore cuando cambien
  useEffect(() => {
    if (!loading) {
      setDoc(doc(db, 'config', 'teams'), { list: teams });
    }
  }, [teams, loading]);

  // Guardar history en Firestore cuando cambie
  useEffect(() => {
    if (!loading) {
      setDoc(doc(db, 'config', 'history'), { list: history });
    }
  }, [history, loading]);

  // Guardar currentGame en Firestore cuando cambie
  useEffect(() => {
    if (!loading) {
      setDoc(doc(db, 'config', 'currentGame'), { game: currentGame });
    }
  }, [currentGame, loading]);

  const handleStartGame = (t1: Team, t2: Team, max: 15 | 30) => {
    setCurrentGame({ team1: t1, team2: t2, score1: 0, score2: 0, maxPoints: max, nextHandIsPica: false, picaHistory: [] });
    setView(GameView.PLAYING);
  };

  const updateScore = (teamIndex: 1 | 2, delta: number, setPicaNext?: boolean) => {
    if (!currentGame) return;
    setCurrentGame(prev => {
      if (!prev) return null;
      let newScore1 = teamIndex === 1 ? Math.max(0, prev.score1 + delta) : prev.score1;
      let newScore2 = teamIndex === 2 ? Math.max(0, prev.score2 + delta) : prev.score2;
      
      newScore1 = Math.min(newScore1, prev.maxPoints);
      newScore2 = Math.min(newScore2, prev.maxPoints);
      
      let nextIsPica = prev.nextHandIsPica;
      if (setPicaNext !== undefined) nextIsPica = setPicaNext;

      return { ...prev, score1: newScore1, score2: newScore2, nextHandIsPica: nextIsPica };
    });
  };

  const updatePicaHistory = (newDuels: PicaDuel[]) => {
    if (!currentGame) return;
    setCurrentGame(prev => {
      if (!prev) return null;
      return { ...prev, picaHistory: [...(prev.picaHistory || []), newDuels] };
    });
  };

  const saveToHistory = (notes: string, duermeAfuera: boolean) => {
    if (!currentGame) return null;
    const winner = currentGame.score1 >= currentGame.maxPoints ? currentGame.team1 : currentGame.team2;
    
    setTeams(prev => prev.map(t => (t.id === winner.id) ? { ...t, wins: t.wins + 1 } : t));
    
    const newRecord: GameRecord = {
      id: 'game-' + Date.now(),
      team1Name: currentGame.team1.name,
      team2Name: currentGame.team2.name,
      score1: currentGame.score1,
      score2: currentGame.score2,
      winnerName: winner.name,
      maxPoints: currentGame.maxPoints,
      timestamp: Date.now(),
      notes,
      duermeAfuera,
      picaHistory: currentGame.picaHistory || []
    };
    
    setHistory(prev => [newRecord, ...prev].slice(0, 100));
    return newRecord;
  };

  const handleFinishGame = (notes: string, duermeAfuera: boolean) => {
    saveToHistory(notes, duermeAfuera);
    setCurrentGame(null);
    setView(GameView.SETUP);
  };

  const handleRematch = (notes: string, duermeAfuera: boolean) => {
    saveToHistory(notes, duermeAfuera);
    if (currentGame) {
      setCurrentGame({
        ...currentGame,
        score1: 0,
        score2: 0,
        nextHandIsPica: false,
        picaHistory: []
      });
    }
  };

  const resetGame = () => currentGame && setCurrentGame({ ...currentGame, score1: 0, score2: 0, nextHandIsPica: false, picaHistory: [] });

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-white italic">TRUCO</h1>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-[0.3em] animate-pulse">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-lg space-y-8 pb-12">
        {view === GameView.SETUP && !currentGame && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <header className="text-center pt-8">
              <h1 className="text-8xl font-black tracking-tighter text-white italic leading-tight">TRUCO</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.4em] mt-4">Anotador Oficial</p>
            </header>
            
            <div className="grid gap-4">
              <button onClick={() => setView(GameView.PLAYING)} className="w-full py-6 btn-primary rounded-[24px] text-sm font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(16,185,129,0.2)]">Nueva Partida</button>
              <button onClick={() => setView(GameView.LEADERBOARD)} className="w-full py-6 btn-secondary rounded-[24px] text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Leaderboard</button>
            </div>
          </div>
        )}

        {view === GameView.SETUP && currentGame && (
          <div className="space-y-10 animate-in zoom-in duration-500">
            <div className="text-center space-y-6">
              <div className="app-card p-10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500"></div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="text-5xl font-black text-blue-500 mb-2 tabular-nums italic">{currentGame.score1}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{currentGame.team1.name}</div>
                  </div>
                  <div className="text-white/5 font-black text-2xl italic select-none">VS</div>
                  <div className="flex-1">
                    <div className="text-5xl font-black text-rose-500 mb-2 tabular-nums italic">{currentGame.score2}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{currentGame.team2.name}</div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] animate-pulse">Partida en Curso</p>
            </div>
            
            <div className="space-y-4">
              <button onClick={() => setView(GameView.PLAYING)} className="w-full py-6 btn-primary rounded-[24px] font-black tracking-widest text-sm uppercase shadow-xl">Continuar</button>
              <button onClick={() => setCurrentGame(null)} className="w-full py-4 text-[10px] font-black text-gray-700 hover:text-rose-500 transition-colors uppercase tracking-[0.2em]">Descartar Juego</button>
            </div>
          </div>
        )}

        {view === GameView.PLAYING && !currentGame && (
          <TeamSetup 
            existingTeams={teams} 
            onStart={handleStartGame} 
            onSaveTeam={(t) => setTeams(prev => {
              const idx = prev.findIndex(item => item.id === t.id);
              if (idx > -1) { const n = [...prev]; n[idx] = t; return n; }
              return [...prev, t];
            })} 
            onBack={() => setView(GameView.SETUP)} 
            onDeleteTeam={(id) => confirm('¿Borrar equipo?') && setTeams(prev => prev.filter(t => t.id !== id))} 
          />
        )}

        {view === GameView.PLAYING && currentGame && (
          <ScoreBoard 
            team1={currentGame.team1} 
            team2={currentGame.team2} 
            score1={currentGame.score1} 
            score2={currentGame.score2} 
            maxPoints={currentGame.maxPoints} 
            onUpdateScore={updateScore} 
            onUpdatePicaHistory={updatePicaHistory}
            onReset={resetGame} 
            onHome={() => setView(GameView.SETUP)} 
            onFinish={handleFinishGame}
            onRematch={handleRematch}
          />
        )}

        {view === GameView.LEADERBOARD && (
          <Leaderboard history={history} onBack={() => setView(GameView.SETUP)} />
        )}
      </main>
    </div>
  );
};

export default App;
