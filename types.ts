
export interface Team {
  id: string;
  name: string;
  players: string[];
  wins: number;
}

export interface PicaDuel {
  p1: string; // Jugador de Equipo 1
  p2: string; // Jugador de Equipo 2
  s1: number; // Puntos de Jugador 1
  s2: number; // Puntos de Jugador 2
}

export interface GameRecord {
  id: string;
  team1Name: string;
  team2Name: string;
  score1: number;
  score2: number;
  winnerName: string;
  maxPoints: number;
  timestamp: number;
  notes?: string;
  duermeAfuera?: boolean;
  picaHistory?: PicaDuel[][];
  nextHandIsPica?: boolean; // Persistencia del estado de la mano
}

export enum GameView {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  LEADERBOARD = 'LEADERBOARD',
  HISTORY = 'HISTORY'
}
