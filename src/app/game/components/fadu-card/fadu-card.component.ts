import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaduCard, Player, StrategySelection } from '../../game.interfaces';
import { StrategySelectorComponent } from '../strategy-selector/strategy-selector.component';
import { FaduService } from '../../fadu.service'; // Chemin corrigé
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-fadu-card',
  standalone: true,
  imports: [CommonModule, StrategySelectorComponent],
  templateUrl: './fadu-card.component.html',
  styleUrls: ['./fadu-card.component.scss'],
  animations: [
    trigger('cardFlip', [
      state('front', style({ transform: 'rotateY(0deg)' })),
      state('back', style({ transform: 'rotateY(180deg)' })),
      transition('front <=> back', animate('500ms ease-out'))
    ]),
    trigger('cardDraw', [
      transition(':enter', [
        style({ transform: 'translateY(-100px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('sacrificeAnimation', [
      transition(':leave', [
        animate('500ms ease-in', style({
          transform: 'scale(1.2) rotate(30deg)',
          opacity: 0
        }))
      ])
    ])
  ]
})
export class FaduCardComponent {
  @Input() card: FaduCard | null = null;
  @Input() currentPlayer!: Player;
  @Input() playerPFH = 0;
  @Input() gamePhase: 'draw' | 'strategy' | 'sacrifice' | 'reveal' = 'draw';
  @Input() isSacrificeDeck = false;
  @Input() cardType: 'standard' | 'sacrifice' = 'standard';

  @Output() cardSelected = new EventEmitter<FaduCard>();
  @Output() strategySelected = new EventEmitter<StrategySelection>();
  @Output() sacrificeDecision = new EventEmitter<boolean>();

  // Animation states
  cardState: 'front' | 'back' = 'back';
  drawAngle = 0;
  isSacrificed = false;
  cardImagePath = '';

  // Game strategies
  readonly strategies = [
    { value: 'V' as const, label: 'Soumission (V)' },
    { value: 'C' as const, label: 'Coopération (C)' },
    { value: 'G' as const, label: 'Guerre (G)' }
  ];

  selectedStrategy: 'V' | 'C' | 'G' | null = null;

  constructor(public faduService: FaduService) { } // Service en public

  // Draw a new card
  drawNewCard(): void {
    this.faduService.drawCard(this.cardType).subscribe({
      next: (card: FaduCard) => {
        this.card = card;
        this.cardImagePath = this.faduService.getCardImage(card);
        this.drawCard();
      },
      error: (err: any) => console.error('Failed to draw card:', err)
    });
  }

  // Handle sacrifice
  handleSacrifice(): void {
    if (!this.canSacrifice()) return;

    this.faduService.performSacrifice(this.playerPFH).subscribe({
      next: (result) => {
        if (result.success && result.card) {
          this.card = result.card;
          this.cardImagePath = this.faduService.getCardImage(result.card);
          this.playerPFH = result.newPfh;
          this.performSacrificeAnimation();
        }
      },
      error: (err: any) => console.error('Sacrifice failed:', err)
    });
  }

  // Animation methods
  drawCard(): void {
    requestAnimationFrame(() => {
      this.drawAngle = Math.random() * 60 - 30; // Angle aléatoire
      this.cardState = 'front';
    });
  }

  flipCard(): void {
    this.cardState = this.cardState === 'front' ? 'back' : 'front';
  }

  performSacrificeAnimation(): void {
    this.isSacrificed = true;
    setTimeout(() => this.isSacrificed = false, 500);
  }

  // Game actions
  onSelectCard(): void {
    if (this.card) {
      this.drawCard(); // Animation avant émission
      this.cardSelected.emit(this.card);
    }
  }

  onSelectStrategy(strategy: 'V' | 'C' | 'G'): void {
    this.selectedStrategy = strategy;
    this.strategySelected.emit({
      player: this.currentPlayer,
      strategy,
      sacrifice: false
    });
    this.flipCard(); // Animation après sélection
  }

  onSacrificeDecision(decision: boolean): void {
    this.sacrificeDecision.emit(decision);
    if (decision) {
      this.performSacrificeAnimation();
      this.strategySelected.emit({
        player: this.currentPlayer,
        strategy: this.selectedStrategy || 'C', // Valeur par défaut
        sacrifice: true
      });
    }
  }

  canSacrifice(): boolean {
    return this.playerPFH >= this.faduService.getSacrificeCost();

  }

  getStrategyDescription(strategy: 'V' | 'C' | 'G'): string {
    const descriptions = {
      'V': 'Soumission: Accepte de perdre des points pour éviter le conflit',
      'C': 'Coopération: Cherche un bénéfice mutuel',
      'G': 'Guerre: Cherche à maximiser son gain au détriment de l\'autre'
    };
    return descriptions[strategy] || '';
  }
}