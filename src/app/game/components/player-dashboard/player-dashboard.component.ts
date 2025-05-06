import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FaduCard } from '../../../game/game.interfaces';

export type Player = 'Favi1' | 'Favi2';
export type Strategy = 'V' | 'C' | 'G';

@Component({
  selector: 'app-player-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-dashboard.component.html',
  styleUrls: ['./player-dashboard.component.scss']
})
export class PlayerDashboardComponent {
  @Input() player: Player = 'Favi1';
  @Input() pfh: number = 140; // Valeur initiale selon les règles du jeu
  @Input() currentTurn: number = 1;
  @Input() isActive: boolean = false;
  @Input() currentStrategy: Strategy | null = null;
  @Input() hasSacrificed: boolean = false;
  @Input() currentCard: FaduCard | null = null;
  @Input() gamePhase: 'draw' | 'strategy' | 'sacrifice' | 'reveal' | 'result' = 'draw';

  @Output() endTurn = new EventEmitter<void>();

  get playerName(): string {
    return this.player === 'Favi1' ? 'Favi 1' : 'Favi 2';
  }

  get statusText(): string {
    if (this.gamePhase === 'result') {
      return 'Résultats du tour';
    }
    return this.isActive ? 'À vous de jouer' : 'En attente...';
  }

  get strategyText(): string {
    if (!this.currentStrategy) return 'Aucune stratégie choisie';

    switch (this.currentStrategy) {
      case 'V': return 'Soumission';
      case 'C': return 'Coopération';
      case 'G': return 'Guerre';
      default: return '';
    }
  }

  onEndTurn(): void {
    this.endTurn.emit();
  }
}
