
import React, { useState, useEffect } from 'react';
import { Team, GameView, GameRecord, PicaDuel, Player } from './types';
import TeamSetup from './components/TeamSetup';
import ScoreBoard from './components/ScoreBoard';
import Leaderboard from './components/Leaderboard';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const DEFAULT_PLAYERS: Player[] = [
  { id: 'player-1', name: 'Juanse' },
  { id: 'player-2', name: 'Tati' },
  { id: 'player-3', name: 'Gordo' },
  { id: 'player-4', name: 'Guido' },
  { id: 'player-5', name: 'Mateo' },
  { id: 'player-6', name: 'Fede' },
];

const DEFAULT_TEAMS: Team[] = [
  { id: 'team-1', name: 'Nosotros', playerIds: ['player-1', 'player-2', 'player-3'], wins: 0 },
  { id: 'team-2', name: 'Ellos', playerIds: ['player-4', 'player-5', 'player-6'], wins: 0 }
];

const BACKUP_KEYS = {
  players: 'truco-backup-players',
  teams: 'truco-backup-teams',
  history: 'truco-backup-history',
  currentGame: 'truco-backup-currentGame',
  timestamp: 'truco-backup-timestamp'
};

const App: React.FC = () => {
  const [view, setView] = useState<GameView>(GameView.SETUP);

  // Flags individuales de carga para evitar race conditions
  const [loadedPlayers, setLoadedPlayers] = useState(false);
  const [loadedTeams, setLoadedTeams] = useState(false);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [loadedCurrentGame, setLoadedCurrentGame] = useState(false);

  const loading = !loadedPlayers || !loadedTeams || !loadedHistory || !loadedCurrentGame;

  // Estado para modal de recuperación de backup
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [backupData, setBackupData] = useState<{ teams: Team[]; history: GameRecord[] } | null>(null);

  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
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
    noMostro: string[];
  } | null>(null);

  // Cargar datos desde Firestore al iniciar
  useEffect(() => {
    const unsubPlayers = onSnapshot(doc(db, 'config', 'players'), (snapshot) => {
      if (snapshot.exists() && snapshot.data().list?.length > 0) {
        setPlayers(snapshot.data().list);
      } else {
        // Si no existe o está vacío, usar defaults
        setPlayers(DEFAULT_PLAYERS);
      }
      setLoadedPlayers(true);
    });

    const unsubTeams = onSnapshot(doc(db, 'config', 'teams'), (snapshot) => {
      if (snapshot.exists()) {
        const teamsData = snapshot.data().list || DEFAULT_TEAMS;
        const newPlayersToAdd: Player[] = [];

        // Migración: convertir formato viejo (players: string[]) a nuevo (playerIds: string[])
        const migratedTeams = teamsData.map((team: any) => {
          if (team.players && !team.playerIds) {
            // Formato viejo: crear IDs para cada jugador
            const playerIds = team.players.map((name: string) => {
              // Buscar si ya existe un jugador con ese nombre
              const existingPlayer = DEFAULT_PLAYERS.find(p => p.name.toLowerCase() === name.toLowerCase());
              if (existingPlayer) return existingPlayer.id;

              // Si no, crear un nuevo jugador
              const newId = 'player-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
              const alreadyAdded = newPlayersToAdd.find(p => p.name.toLowerCase() === name.toLowerCase());
              if (!alreadyAdded) {
                newPlayersToAdd.push({ id: newId, name });
              }
              return alreadyAdded?.id || newId;
            });
            return { ...team, playerIds, players: undefined };
          }
          return team;
        });

        // Agregar jugadores nuevos encontrados en equipos viejos
        if (newPlayersToAdd.length > 0) {
          setPlayers(prev => [...prev, ...newPlayersToAdd]);
        }

        setTeams(migratedTeams);
      }
      setLoadedTeams(true);
    });

    const unsubHistory = onSnapshot(doc(db, 'config', 'history'), (snapshot) => {
      if (snapshot.exists()) {
        // Deserializar picaHistory de cada GameRecord (guardado como JSON string para evitar nested arrays)
        const list = (snapshot.data().list || []).map((record: GameRecord) => ({
          ...record,
          picaHistory: typeof record.picaHistory === 'string'
            ? JSON.parse(record.picaHistory)
            : (record.picaHistory || [])
        }));
        setHistory(list);
      }
      setLoadedHistory(true);
    });

    const unsubCurrentGame = onSnapshot(doc(db, 'config', 'currentGame'), (snapshot) => {
      if (snapshot.exists() && snapshot.data().game) {
        const game = snapshot.data().game;
        // Deserializar picaHistory (guardado como JSON string para evitar nested arrays)
        const picaHistory = typeof game.picaHistory === 'string'
          ? JSON.parse(game.picaHistory)
          : (game.picaHistory || []);

        const newPlayersFromGame: Player[] = [];

        // Migrar teams dentro del currentGame si tienen formato viejo
        const migrateTeam = (team: any) => {
          if (team.players && !team.playerIds) {
            const playerIds = team.players.map((name: string) => {
              const existingPlayer = DEFAULT_PLAYERS.find(p => p.name.toLowerCase() === name.toLowerCase());
              if (existingPlayer) return existingPlayer.id;

              const newId = 'player-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
              const alreadyAdded = newPlayersFromGame.find(p => p.name.toLowerCase() === name.toLowerCase());
              if (!alreadyAdded) {
                newPlayersFromGame.push({ id: newId, name });
              }
              return alreadyAdded?.id || newId;
            });
            return { ...team, playerIds };
          }
          return team;
        };

        if (newPlayersFromGame.length > 0) {
          setPlayers(prev => [...prev, ...newPlayersFromGame]);
        }

        setCurrentGame({
          ...game,
          team1: migrateTeam(game.team1),
          team2: migrateTeam(game.team2),
          picaHistory,
          noMostro: game.noMostro || []
        });
      } else {
        setCurrentGame(null);
      }
      setLoadedCurrentGame(true);
    });

    return () => {
      unsubPlayers();
      unsubTeams();
      unsubHistory();
      unsubCurrentGame();
    };
  }, []);

  // Guardar players en Firestore y localStorage cuando cambien
  useEffect(() => {
    if (!loading) {
      setDoc(doc(db, 'config', 'players'), { list: players });
      localStorage.setItem(BACKUP_KEYS.players, JSON.stringify(players));
      localStorage.setItem(BACKUP_KEYS.timestamp, Date.now().toString());
    }
  }, [players, loading]);

  // Guardar teams en Firestore y localStorage cuando cambien
  useEffect(() => {
    if (!loading) {
      setDoc(doc(db, 'config', 'teams'), { list: teams });
      localStorage.setItem(BACKUP_KEYS.teams, JSON.stringify(teams));
      localStorage.setItem(BACKUP_KEYS.timestamp, Date.now().toString());
    }
  }, [teams, loading]);

  // Guardar history en Firestore y localStorage cuando cambie
  useEffect(() => {
    if (!loading) {
      // Serializar picaHistory de cada GameRecord (Firestore no soporta nested arrays)
      const historyToSave = history.map(record => ({
        ...record,
        picaHistory: JSON.stringify(record.picaHistory || [])
      }));
      setDoc(doc(db, 'config', 'history'), { list: historyToSave });
      localStorage.setItem(BACKUP_KEYS.history, JSON.stringify(history));
      localStorage.setItem(BACKUP_KEYS.timestamp, Date.now().toString());
    }
  }, [history, loading]);

  // Guardar currentGame en Firestore y localStorage cuando cambie
  useEffect(() => {
    if (!loading) {
      // Serializar picaHistory (Firestore no soporta nested arrays)
      const gameToSave = currentGame ? {
        ...currentGame,
        picaHistory: JSON.stringify(currentGame.picaHistory || [])
      } : null;
      setDoc(doc(db, 'config', 'currentGame'), { game: gameToSave });
      localStorage.setItem(BACKUP_KEYS.currentGame, JSON.stringify(currentGame));
      localStorage.setItem(BACKUP_KEYS.timestamp, Date.now().toString());
    }
  }, [currentGame, loading]);

  // Detectar si hay backup disponible cuando Firestore está vacío
  useEffect(() => {
    if (!loading && !showRecoveryModal) {
      const backupTeams = localStorage.getItem(BACKUP_KEYS.teams);
      const backupHistory = localStorage.getItem(BACKUP_KEYS.history);

      // Si Firestore tiene equipos vacíos o default pero hay backup con datos
      const teamsAreEmpty = teams.length === 0 ||
        (teams.length === 2 && teams[0].id === 'team-1' && teams[0].wins === 0 && teams[1].wins === 0);

      if (teamsAreEmpty && backupTeams) {
        try {
          const parsedTeams = JSON.parse(backupTeams);
          const parsedHistory = backupHistory ? JSON.parse(backupHistory) : [];

          // Solo mostrar si el backup tiene datos significativos
          const backupHasWins = parsedTeams.some((t: Team) => t.wins > 0);
          const backupHasHistory = parsedHistory.length > 0;

          if (backupHasWins || backupHasHistory) {
            setBackupData({ teams: parsedTeams, history: parsedHistory });
            setShowRecoveryModal(true);
          }
        } catch {
          // Ignorar errores de parsing
        }
      }
    }
  }, [loading, teams, showRecoveryModal]);

  // Función para restaurar desde backup
  const restoreFromBackup = () => {
    if (backupData) {
      setTeams(backupData.teams);
      setHistory(backupData.history);
      setShowRecoveryModal(false);
      setBackupData(null);
    }
  };

  const handleStartGame = (t1: Team, t2: Team, max: 15 | 30) => {
    setCurrentGame({ team1: t1, team2: t2, score1: 0, score2: 0, maxPoints: max, nextHandIsPica: false, picaHistory: [], noMostro: [] });
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
      picaHistory: currentGame.picaHistory || [],
      noMostro: currentGame.noMostro || []
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
        picaHistory: [],
        noMostro: []
      });
    }
  };

  const resetGame = () => currentGame && setCurrentGame({ ...currentGame, score1: 0, score2: 0, nextHandIsPica: false, picaHistory: [], noMostro: [] });

  const addNoMostro = (playerId: string) => {
    if (!currentGame) return;
    setCurrentGame(prev => prev ? {
      ...prev,
      noMostro: [...(prev.noMostro || []), playerId]
    } : null);
  };

  // CRUD de jugadores
  const handleSavePlayer = (player: Player) => {
    setPlayers(prev => {
      const idx = prev.findIndex(p => p.id === player.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = player;
        return updated;
      }
      return [...prev, player];
    });
  };

  const handleDeletePlayer = (playerId: string) => {
    // Verificar que no esté en uso en ningún equipo
    const inUse = teams.some(t => t.playerIds.includes(playerId));
    if (inUse) {
      alert('No se puede eliminar: el jugador está en un equipo');
      return;
    }
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const handleDeleteGame = (gameId: string) => {
    const gameToDelete = history.find(g => g.id === gameId);
    if (!gameToDelete) return;

    // Restar 1 win al equipo ganador
    setTeams(prev => prev.map(t =>
      t.name === gameToDelete.winnerName ? { ...t, wins: Math.max(0, t.wins - 1) } : t
    ));

    // Eliminar del historial
    setHistory(prev => prev.filter(g => g.id !== gameId));
  };

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
            players={players}
            onStart={handleStartGame}
            onSaveTeam={(t) => setTeams(prev => {
              const idx = prev.findIndex(item => item.id === t.id);
              if (idx > -1) { const n = [...prev]; n[idx] = t; return n; }
              return [...prev, t];
            })}
            onSavePlayer={handleSavePlayer}
            onDeletePlayer={handleDeletePlayer}
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
            players={players}
            noMostro={currentGame.noMostro}
            onUpdateScore={updateScore}
            onUpdatePicaHistory={updatePicaHistory}
            onAddNoMostro={addNoMostro}
            onReset={resetGame}
            onHome={() => setView(GameView.SETUP)}
            onFinish={handleFinishGame}
            onRematch={handleRematch}
          />
        )}

        {view === GameView.LEADERBOARD && (
          <Leaderboard history={history} players={players} onBack={() => setView(GameView.SETUP)} onDeleteGame={handleDeleteGame} />
        )}
      </main>

      {/* Modal de recuperación de backup */}
      {showRecoveryModal && backupData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="app-card p-6 max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-white">Recuperar Datos?</h2>
            <p className="text-sm text-gray-400">
              Se encontró un backup local con {backupData.teams.length} equipos
              y {backupData.history.length} partidos guardados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={restoreFromBackup}
                className="flex-1 py-3 btn-primary rounded-xl font-bold text-sm"
              >
                Restaurar
              </button>
              <button
                onClick={() => { setShowRecoveryModal(false); setBackupData(null); }}
                className="flex-1 py-3 btn-secondary rounded-xl font-bold text-sm text-gray-400"
              >
                Ignorar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
