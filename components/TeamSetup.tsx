
import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { Plus, Trash2, X, ArrowLeft, Edit2, Zap, ArrowUpDown } from 'lucide-react';

interface TeamSetupProps {
  existingTeams: Team[];
  onStart: (team1: Team, team2: Team, maxPoints: 15 | 30) => void;
  onBack: () => void;
  onDeleteTeam?: (id: string) => void;
  onSaveTeam: (team: Team) => void;
}

const TeamSetup: React.FC<TeamSetupProps> = ({ existingTeams, onStart, onBack, onDeleteTeam, onSaveTeam }) => {
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [maxPoints, setMaxPoints] = useState<15 | 30>(30);
  const [isEditing, setIsEditing] = useState(false);
  const [editTeam, setEditTeam] = useState<Team>({ id: '', name: '', players: [], wins: 0 });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const isPicaAPicaReady = team1?.players.length === 3 && team2?.players.length === 3;

  const handleStartEditing = (team?: Team) => {
    if (team) {
      setEditTeam(team);
    } else {
      setEditTeam({ id: 'team-' + Date.now(), name: '', players: [], wins: 0 });
    }
    setNewPlayerName('');
    setIsEditing(true);
  };

  const handlePlayerSwap = (index: number) => {
    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      if (team2) {
        const newPlayers = [...team2.players];
        const temp = newPlayers[selectedIndex];
        newPlayers[selectedIndex] = newPlayers[index];
        newPlayers[index] = temp;
        setTeam2({ ...team2, players: newPlayers });
        setSelectedIndex(null);
      }
    }
  };

  if (isEditing) {
    return (
      <div className="w-full max-w-md mx-auto py-4 animate-in fade-in duration-300">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setIsEditing(false)} className="p-3 bg-white/5 rounded-2xl text-white active:scale-90"><ArrowLeft size={20} /></button>
          <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Editar Equipo</h2>
        </header>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Nombre</label>
            <input 
              autoFocus
              className="w-full bg-white/[0.03] p-5 rounded-[20px] outline-none border border-white/5 focus:border-emerald-500/50 transition-all font-bold text-white text-lg"
              placeholder="Nombre del equipo..."
              value={editTeam.name}
              onChange={e => setEditTeam({ ...editTeam, name: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Jugadores</label>
            <div className="flex gap-3">
              <input 
                className="flex-1 bg-white/[0.03] p-5 rounded-[20px] outline-none border border-white/5 focus:border-emerald-500/50 transition-all text-base text-white font-medium"
                placeholder="Nombre..."
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                onKeyDown={e => { if(e.key === 'Enter' && newPlayerName.trim()) { 
                  setEditTeam(prev => ({ ...prev, players: [...prev.players, newPlayerName.trim()] }));
                  setNewPlayerName('');
                }}}
              />
              <button onClick={() => {
                if(newPlayerName.trim()) setEditTeam(prev => ({ ...prev, players: [...prev.players, newPlayerName.trim()] }));
                setNewPlayerName('');
              }} className="bg-emerald-500 px-6 rounded-[20px] font-black text-black active:scale-95 transition-all"><Plus size={24} /></button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {editTeam.players.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-sm font-bold text-gray-300">
                  {p}
                  <button onClick={() => setEditTeam({...editTeam, players: editTeam.players.filter((_, idx) => idx !== i)})} className="text-gray-500 hover:text-rose-500"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <button 
            disabled={!editTeam.name.trim() || editTeam.players.length === 0}
            onClick={() => { onSaveTeam(editTeam); setIsEditing(false); }}
            className="w-full py-5 btn-primary font-black rounded-[24px] shadow-lg disabled:opacity-20 mt-4 text-sm uppercase tracking-widest"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-4xl font-black tracking-tighter text-white italic">EQUIPOS</h2>
        <p className="text-gray-500 text-[10px] mt-1 font-black uppercase tracking-[0.3em]">Seleccioná los bandos</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-6 app-card transition-all duration-300 border-2 ${team1 ? 'border-blue-500 bg-blue-500/5 neon-blue' : 'border-transparent'}`}>
          <p className="text-[10px] font-black text-blue-500/50 uppercase mb-2 tracking-widest">Nosotros</p>
          <div className="font-black truncate text-base text-white uppercase italic">{team1 ? team1.name : '—'}</div>
        </div>
        <div className={`p-6 app-card transition-all duration-300 border-2 ${team2 ? 'border-rose-500 bg-rose-500/5 neon-red' : 'border-transparent'}`}>
          <p className="text-[10px] font-black text-rose-500/50 uppercase mb-2 tracking-widest">Ellos</p>
          <div className="font-black truncate text-base text-white uppercase italic">{team2 ? team2.name : '—'}</div>
        </div>
      </div>

      {isPicaAPicaReady && (
        <div className="app-card p-6 animate-in slide-in-from-bottom-6 bg-amber-500/[0.03] border-amber-500/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-500 fill-amber-500" />
              <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-widest italic">Alineación Pica a Pica</h3>
            </div>
          </div>
          
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl text-center">
                  <span className="text-xs font-black text-blue-400 truncate block uppercase">{team1?.players[i]}</span>
                </div>
                <div className="text-[10px] font-black text-gray-700 italic">VS</div>
                <button 
                  onClick={() => handlePlayerSwap(i)}
                  className={`flex-1 p-4 rounded-2xl border transition-all text-center uppercase ${selectedIndex === i ? 'bg-rose-500 text-black border-white scale-105 z-10' : 'bg-rose-500/5 border-rose-500/10 text-rose-400'}`}
                >
                  <span className="text-xs font-black truncate block">{team2?.players[i]}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Guardados</h3>
          <button onClick={() => handleStartEditing()} className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full active:scale-95">
            <Plus size={14} strokeWidth={3} /> Nuevo
          </button>
        </div>

        <div className="grid gap-4">
          {existingTeams.map(team => (
            <div key={team.id} className="app-card p-5 space-y-4 border-white/5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="font-black text-sm text-white uppercase italic tracking-tight">{team.name}</div>
                  <div className="text-[10px] text-gray-500 truncate mt-1 font-medium">{team.players.join(' · ')}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleStartEditing(team)} className="p-2 text-gray-600 hover:text-white bg-white/5 rounded-lg active:scale-90"><Edit2 size={14} /></button>
                  <button onClick={() => onDeleteTeam?.(team.id)} className="p-2 text-gray-600 hover:text-rose-500 bg-white/5 rounded-lg active:scale-90"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => team1?.id === team.id ? setTeam1(null) : setTeam1(team)}
                  className={`py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${team1?.id === team.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-500'}`}
                >
                  Nosotros
                </button>
                <button 
                  onClick={() => team2?.id === team.id ? setTeam2(null) : setTeam2(team)}
                  className={`py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${team2?.id === team.id ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-gray-500'}`}
                >
                  Ellos
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 space-y-5">
        <div className="flex bg-white/[0.03] p-1.5 rounded-[20px] border border-white/5">
          <button onClick={() => setMaxPoints(15)} className={`flex-1 py-3.5 rounded-[14px] text-[11px] font-black tracking-widest transition-all ${maxPoints === 15 ? 'bg-white/10 text-white shadow-inner' : 'text-gray-600'}`}>A 15</button>
          <button onClick={() => setMaxPoints(30)} className={`flex-1 py-3.5 rounded-[14px] text-[11px] font-black tracking-widest transition-all ${maxPoints === 30 ? 'bg-white/10 text-white shadow-inner' : 'text-gray-600'}`}>A 30</button>
        </div>
        
        <button 
          disabled={!team1 || !team2}
          onClick={() => onStart(team1!, team2!, maxPoints)}
          className="w-full py-6 btn-primary text-black font-black uppercase tracking-[0.3em] rounded-[24px] shadow-2xl disabled:opacity-20 active:scale-95 text-xs"
        >
          ¡JUGAR!
        </button>
        
        <button onClick={onBack} className="w-full text-gray-700 text-[10px] font-black uppercase tracking-[0.4em] py-2 hover:text-white transition-colors">Volver al inicio</button>
      </div>
    </div>
  );
};

export default TeamSetup;
