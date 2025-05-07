import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GameService } from '../../../game/game.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  currentPFH = 0;
  gamePhase = 'menu';
  private readonly gameSubs: Subscription[] = [];

  navigationLinks = [
    { path: '/', label: 'Accueil', icon: 'bi-house' },
    { path: '/game', label: 'Nouvelle Partie', icon: 'bi-plus-circle' },
    { path: '/matchmaking', label: 'Matchmaking', icon: 'bi-people' },
    { path: '/auth/login', label: 'Connexion', icon: 'bi-box-arrow-in-right' },
    { path: '/auth/register', label: 'Inscription', icon: 'bi-person-plus' }
  ];

  constructor(private readonly gameService: GameService) { }

  ngOnInit(): void {
    this.gameSubs.push(
      this.gameService.currentPFH$.subscribe(pfh => {
        this.currentPFH = pfh;
      }),
      this.gameService.gamePhase$.subscribe(phase => {
        this.gamePhase = phase;
      })
    );
  }

  ngOnDestroy(): void {
    this.gameSubs.forEach(sub => sub.unsubscribe());
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  getGameStatus(): string {
    return this.gamePhase === 'menu'
      ? 'Prêt pour la bataille'
      : `Phase: ${this.gamePhase} | PFH: ${this.currentPFH}`;
  }

  resetGame(): void {
    this.gameService.resetGameState();
  }
}