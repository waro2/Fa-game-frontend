export interface GameState {
  currentTurn: number;
  maxTurns: number;
  gamePhase: 'preparation' | 'draw' | 'strategy' | 'sacrifice' | 'resolution' | 'ended';
  players: {
    [key: string]: PlayerState; // Utilisez 'Favi1' | 'Favi2' comme clés si préféré
  };
  winner: string | null;
  winningCondition?: 'pfh' | 'turns' | 'surrender';
  history: TurnHistory[];
}

export interface PlayerState {
  id: string;
  name: string;
  pfh: number;
  strategy?: Strategy;
  currentCard?: FaduCard;
  hasSacrificed: boolean;
  consecutiveLosses: number;
}

export interface TurnHistory {
  turnNumber: number;
  actions: PlayerAction[];
  results: {
    pfhChanges: { [playerId: string]: number };
    strategyOutcome: string;
  };
}

export interface PlayerAction {
  playerId: string;
  actionType: 'draw' | 'strategy' | 'sacrifice';
  details: {
    cardDrawn?: FaduCard;
    strategySelected?: Strategy;
    sacrificeMade?: boolean;
  };
  timestamp: Date;
}

// Types utilitaires
export type Strategy = 'V' | 'C' | 'G'; // Soumission, Coopération, Guerre

export interface FaduCard {
  id: string;
  type: 'standard' | 'sacrifice';
  pfhValue: number;
  effect?: CardEffect;
}

interface CardEffect {
  type: 'bonus' | 'malus' | 'special';
  description: string;
  modifier: number;
}