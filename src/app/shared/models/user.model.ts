import { Strategy } from './game-state.model';
export interface User {
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
  stats: GameStats;
  preferences: UserPreferences;
  auth: AuthData;
}

export interface UserProfile {
  avatar: string;
  bio?: string;
  country?: string;
  joinDate: Date;
  lastLogin: Date;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  favoriteStrategy: Strategy;
  pfhRecord: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockDate?: Date;
  icon: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'strategic';
  language: string;
  notifications: {
    gameStart: boolean;
    turnAlert: boolean;
    newsletter: boolean;
  };
  autoSacrifice: boolean;
  defaultStrategy?: Strategy;
}

export interface AuthData {
  lastTokenRefresh: Date;
  accountStatus: 'active' | 'banned' | 'inactive';
  roles: ('player' | 'admin' | 'premium')[];
}

// Pour les données de connexion
export interface AuthUser {
  email: string;
  password: string;
  rememberMe: boolean;
}