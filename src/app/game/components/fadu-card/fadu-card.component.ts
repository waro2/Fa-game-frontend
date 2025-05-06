import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaduCard, Strategy, StrategySelection, Player } from '../../game.interfaces'; // Vérifiez le chemin
import { StrategySelectorComponent } from '../strategy-selector/strategy-selector.component';
import {
  cardFlipTrigger,
  cardDrawTrigger,
  sacrificeDeckTrigger
} from '../../../../assets/animations/card-flip.animation';
@Component({
  selector: 'app-fadu-card',
  standalone: true,
  imports: [CommonModule, StrategySelectorComponent],
  templateUrl: './fadu-card.component.html',
  styleUrls: ['./fadu-card.component.scss'],
  animations: [
    cardFlipTrigger,
    cardDrawTrigger,
    sacrificeDeckTrigger
  ]
})
export class FaduCardComponent {
  @Input() card: FaduCard | null = null;
  @Input() currentPlayer!: Player;
  @Input() playerPFH!: number;
  @Input() gamePhase!: string;
  @Input() isSacrificeDeck = false;
  @Input() cardType: 'standard' | 'sacrifice' = 'standard';
  @Input() isFlipped = false;

  @Output() cardSelected = new EventEmitter<FaduCard>();
  @Output() strategySelected = new EventEmitter<StrategySelection>();
  @Output() sacrificeDecision = new EventEmitter<boolean>();

  // États d'animation
  cardState: 'front' | 'back' = 'back';
  drawAngle = 0;
  isSacrificed = false;

  // Stratégies disponibles
  strategies: { value: 'V' | 'C' | 'G', label: string }[] = [
    { value: 'V', label: 'Soumission (V)' },
    { value: 'C', label: 'Coopération (C)' },
    { value: 'G', label: 'Guerre (G)' }
  ];

  selectedStrategy: 'V' | 'C' | 'G' | null = null;
  sacrificeCost: number = 14;

  // Méthodes d'animation
  drawCard() {
    this.drawAngle = Math.random() * 60 - 30; // Angle aléatoire entre -30 et 30 degrés
  }

  flipCard() {
    this.cardState = this.cardState === 'front' ? 'back' : 'front';
  }

  performSacrificeAnimation() {
    this.isSacrificed = true;
  }

  // Méthodes existantes avec intégration des animations
  onSelectCard(): void {
    if (this.card) {
      this.drawCard(); // Lance l'animation de tirage
      this.cardSelected.emit(this.card);
    }
  }

  onSelectStrategy(strategy: Strategy): void {
    this.selectedStrategy = strategy;
    this.strategySelected.emit({
      player: this.currentPlayer,
      strategy,
      sacrifice: false
    });
    this.flipCard(); // Retourne la carte après sélection
  }

  onSacrificeDecision(decision: boolean): void {
    this.sacrificeDecision.emit(decision);
    if (decision) {
      this.performSacrificeAnimation(); // Lance l'animation de sacrifice
      this.strategySelected.emit({
        player: this.currentPlayer,
        strategy: this.selectedStrategy || 'C',
        sacrifice: true
      });
    }
  }


  canSacrifice(): boolean {
    return this.playerPFH >= this.sacrificeCost;
  }



  getStrategyDescription(strategy: 'V' | 'C' | 'G'): string {
    switch (strategy) {
      case 'V': return 'Soumission: Accepte de perdre des points pour éviter le conflit';
      case 'C': return 'Coopération: Cherche un bénéfice mutuel';
      case 'G': return 'Guerre: Cherche à maximiser son gain au détriment de l\'autre';
      default: return '';
    }
  }
}
