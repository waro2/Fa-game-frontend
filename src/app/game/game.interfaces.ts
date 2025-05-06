export interface FaduCard {
    id: number;
    name: string;
    pfhValue: number;
    isSacrifice: boolean;
    image: string;
    type: 'standard' | 'sacrifice';
}

export type Player = 'Favi1' | 'Favi2';
export type Strategy = 'V' | 'C' | 'G';

export interface StrategySelection {
    player: Player;
    strategy: Strategy;
    sacrifice: boolean;
}

// Ajoutez cette interface
export interface StrategyOption {
    value: Strategy;
    label: string;
    description: string;
}

export interface GameTurn {
    turn: number;
    favi1: {
        sacrifice: boolean;
        card: FaduCard | null;
        strategy: Strategy | null;
        pfh: number;
    };
    favi2: {
        sacrifice: boolean;
        card: FaduCard | null;
        strategy: Strategy | null;
        pfh: number;
    };
}