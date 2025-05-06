import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Strategy, StrategyOption } from '../../game.interfaces';

@Component({
  selector: 'app-strategy-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './strategy-selector.component.html',
  styleUrls: ['./strategy-selector.component.scss']
})
export class StrategySelectorComponent {
  @Input() currentPlayer!: 'Favi1' | 'Favi2';
  @Input() playerPFH!: number;
  @Input() selectedStrategy: Strategy | null = null;


  @Output() strategySelected = new EventEmitter<Strategy>();
  @Output() sacrificeRequested = new EventEmitter<boolean>();

  readonly strategies: StrategyOption[] = [
    { value: 'V', label: 'Soumission (V)', description: 'Accepte de perdre des points pour éviter le conflit' },
    { value: 'C', label: 'Coopération (C)', description: 'Cherche un bénéfice mutuel' },
    { value: 'G', label: 'Guerre (G)', description: 'Cherche à maximiser son gain au détriment de l\'autre' }
  ];

  readonly sacrificeCost = 14;

  selectStrategy(strategy: Strategy): void {
    this.selectedStrategy = strategy;
    this.strategySelected.emit(strategy);
  }

  requestSacrifice(doSacrifice: boolean): void {
    this.sacrificeRequested.emit(doSacrifice);
  }

  canSacrifice(): boolean {
    return this.playerPFH >= this.sacrificeCost;
  }
}
