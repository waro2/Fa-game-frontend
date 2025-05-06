
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaduCardComponent } from '../../components/fadu-card/fadu-card.component';
import { PlayerDashboardComponent } from '../../components/player-dashboard/player-dashboard.component';
import { FaduCard, Strategy } from '../../game.interfaces';
import { OnInit } from '@angular/core';
import { Player, GameTurn } from '../../game.interfaces';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule,
    FaduCardComponent,
    PlayerDashboardComponent
  ],
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements OnInit {
  currentPlayer: 'Favi1' | 'Favi2' = 'Favi1';
  gamePhase: 'draw' | 'strategy' | 'sacrifice' | 'reveal' | 'result' = 'draw';
  currentTurn: number = 1;

  // Valeurs initiales selon les règles du jeu
  favi1PFH: number = 140;
  favi2PFH: number = 140;

  // Cartes tirées
  favi1Card: FaduCard | null = null;
  favi2Card: FaduCard | null = null;

  // Stratégies choisies
  favi1Strategy: Strategy | null = null;
  favi2Strategy: Strategy | null = null;

  // Sacrifices
  favi1Sacrifice: boolean = false;
  favi2Sacrifice: boolean = false;

  // Historique des tours
  gameHistory: GameTurn[] = [];

  // Jeu terminé ?
  gameOver: boolean = false;
  winner: 'Favi1' | 'Favi2' | 'Draw' | null = null;

  // Constantes du jeu
  readonly SACRIFICE_COST = 14;
  readonly WINNING_PFH = 280;
  readonly MAX_TURNS = 20;

  ngOnInit(): void {
    this.initializeGame();
  }

  initializeGame(): void {
    this.currentTurn = 1;
    this.favi1PFH = 140;
    this.favi2PFH = 140;
    this.gameHistory = [];
    this.gameOver = false;
    this.winner = null;
    this.startNewTurn();
  }

  startNewTurn(): void {
    this.currentPlayer = 'Favi1';
    this.gamePhase = 'draw';
    this.favi1Card = null;
    this.favi2Card = null;
    this.favi1Strategy = null;
    this.favi2Strategy = null;
    this.favi1Sacrifice = false;
    this.favi2Sacrifice = false;
  }

  onCardSelected(player: 'Favi1' | 'Favi2', card: FaduCard): void {
    if (player === 'Favi1') {
      this.favi1Card = card;
    } else {
      this.favi2Card = card;
    }

    // Passer à la phase de stratégie quand les deux ont tiré
    if (this.favi1Card && this.favi2Card) {
      this.gamePhase = 'strategy';
    }
  }

  onStrategySelected(event: { player: Player, strategy: Strategy, sacrifice: boolean }): void {
    if (event.player === 'Favi1') {
      this.favi1Strategy = event.strategy;
      this.favi1Sacrifice = event.sacrifice;
      if (event.sacrifice) {
        this.favi1PFH -= this.SACRIFICE_COST;
      }
    } else {
      this.favi2Strategy = event.strategy;
      this.favi2Sacrifice = event.sacrifice;
      if (event.sacrifice) {
        this.favi2PFH -= this.SACRIFICE_COST;
      }
    }



    // Passer à la phase de sacrifice si les deux ont choisi leur stratégie
    if (this.favi1Strategy && this.favi2Strategy) {
      this.gamePhase = 'reveal';
      setTimeout(() => {
        this.calculateTurnResults();
      }, 1500);
    }
  }
  getPhaseName(phase: string): string {
    switch (phase) {
      case 'draw': return 'Tirage des cartes';
      case 'strategy': return 'Choix de stratégie';
      case 'sacrifice': return 'Décision de sacrifice';
      case 'reveal': return 'Révélation des résultats';
      case 'result': return 'Résultats du tour';
      default: return '';
    }
  }

  calculateTurnResults(): void {
    if (!this.favi1Card || !this.favi2Card || !this.favi1Strategy || !this.favi2Strategy) return;

    // Calcul des gains selon la matrice de gains du jeu
    const gains = this.calculateGains(
      this.favi1Strategy,
      this.favi2Strategy,
      this.favi1Card.pfhValue,
      this.favi2Card.pfhValue
    );

    this.favi1PFH += gains.favi1Gain;
    this.favi2PFH += gains.favi2Gain;

    // Enregistrer le tour dans l'historique
    this.gameHistory.push({
      turn: this.currentTurn,
      favi1: {
        sacrifice: this.favi1Sacrifice,
        card: this.favi1Card,
        strategy: this.favi1Strategy,
        pfh: this.favi1PFH
      },
      favi2: {
        sacrifice: this.favi2Sacrifice,
        card: this.favi2Card,
        strategy: this.favi2Strategy,
        pfh: this.favi2PFH
      }
    });

    // Vérifier les conditions de fin de jeu
    this.checkGameEndConditions();

    if (!this.gameOver) {
      this.gamePhase = 'result';
    }
  }

  calculateGains(strategy1: Strategy, strategy2: Strategy, pfh1: number, pfh2: number): { favi1Gain: number, favi2Gain: number } {
    // Implémentation de la matrice de gains selon les règles du jeu
    const a = 0, b = 0, c = 0.2, d = 0.2, e = 0.3, f = 0.8;
    const X = pfh1, Y = pfh2;
    const IXgtY = X > Y ? 1 : 0;
    const IYgtX = Y > X ? 1 : 0;

    let favi1Gain = 0, favi2Gain = 0;

    if (strategy1 === 'V' && strategy2 === 'V') {
      favi1Gain = (1 - a) * X + b * Y;
      favi2Gain = a * X + (1 - b) * Y;
    }
    else if (strategy1 === 'V' && strategy2 === 'C') {
      favi1Gain = X + (1 - f) * c * (X + Y);
      favi2Gain = Y + f * c * (X + Y);
    }
    else if (strategy1 === 'V' && strategy2 === 'G') {
      favi1Gain = (1 - c) * X;
      favi2Gain = Y + c * X;
    }
    else if (strategy1 === 'C' && strategy2 === 'V') {
      favi1Gain = X + f * c * (X + Y);
      favi2Gain = Y + (1 - f) * c * (X + Y);
    }
    else if (strategy1 === 'C' && strategy2 === 'C') {
      favi1Gain = (1 + c) * X;
      favi2Gain = (1 + c) * Y;
    }
    else if (strategy1 === 'C' && strategy2 === 'G') {
      favi1Gain = (1 - c) * (1 + c) * X;
      favi2Gain = (1 + c) * (Y + c * X);
    }
    else if (strategy1 === 'G' && strategy2 === 'V') {
      favi1Gain = X + c * Y;
      favi2Gain = (1 - c) * Y;
    }
    else if (strategy1 === 'G' && strategy2 === 'C') {
      favi1Gain = (1 + c) * (X + c * Y);
      favi2Gain = (1 - c) * (1 + c) * Y;
    }
    else if (strategy1 === 'G' && strategy2 === 'G') {
      favi1Gain = (1 - d) * X + c * Y * (IXgtY - c * X * IYgtX);
      favi2Gain = (1 - d) * Y + c * X * (IYgtX - c * Y * IXgtY);
    }

    return {
      favi1Gain: favi1Gain - X, // On soustrait X pour avoir le gain net
      favi2Gain: favi2Gain - Y  // On soustrait Y pour avoir le gain net
    };
  }

  checkGameEndConditions(): void {
    // Condition 1: PFH <= 0 pendant 3 tours successifs
    const lastThreeTurns = this.gameHistory.slice(-3);
    if (lastThreeTurns.length === 3) {
      const favi1BelowZero = lastThreeTurns.every(t => t.favi1.pfh <= 0);
      const favi2BelowZero = lastThreeTurns.every(t => t.favi2.pfh <= 0);

      if (favi1BelowZero) {
        this.gameOver = true;
        this.winner = 'Favi2';
        return;
      }
      if (favi2BelowZero) {
        this.gameOver = true;
        this.winner = 'Favi1';
        return;
      }
    }

    // Condition 2: Un joueur atteint 280 PFH
    if (this.favi1PFH >= this.WINNING_PFH) {
      this.gameOver = true;
      this.winner = 'Favi1';
      return;
    }
    if (this.favi2PFH >= this.WINNING_PFH) {
      this.gameOver = true;
      this.winner = 'Favi2';
      return;
    }

    // Condition 3: 20 tours de jeu
    if (this.currentTurn >= this.MAX_TURNS) {
      this.gameOver = true;
      this.winner = this.favi1PFH > this.favi2PFH ? 'Favi1' :
        this.favi2PFH > this.favi1PFH ? 'Favi2' : 'Draw';
      return;
    }
  }

  onEndTurn(): void {
    this.currentTurn++;
    this.startNewTurn();
  }

  restartGame(): void {
    this.initializeGame();
  }
}
