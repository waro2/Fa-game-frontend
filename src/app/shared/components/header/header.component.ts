import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GameService } from '../../../game/game.service';
import { AuthService } from '../../../auth/auth.service'; // Import du service d'authentification
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
  gamePhase: 'menu' | 'draft' | 'battle' | 'result' = 'menu';
  private gameSubs: Subscription[] = [];

  // Liens de navigation pour utilisateurs non connectés
  navigationLinks = [
    { path: '', label: 'Accueil', icon: 'bi-house' },
    { path: '/game', label: 'Nouvelle Partie', icon: 'bi-plus-circle' },
    { path: '/matchmaking', label: 'Matchmaking', icon: 'bi-people-fill' },
    { path: '/strategies', label: 'Stratégies', icon: 'bi-lightbulb' },
    { path: '/leaderboard', label: 'Classement', icon: 'bi-trophy' },
    { path: '/auth/login', label: 'Connexion', icon: 'bi-box-arrow-in-right' }
  ];

  // Liens pour utilisateurs connectés
  authLinks = [
    { path: '/dashboard', label: 'Tableau de bord', icon: 'bi-speedometer2' },
    { path: '/profile', label: 'Profil', icon: 'bi-person' },
    { path: '/matchmaking', label: 'Matchmaking', icon: 'bi-people-fill' },
    { action: 'logout', label: 'Déconnexion', icon: 'bi-box-arrow-left' }
  ];

  constructor(
    private gameService: GameService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.gameSubs.push(
      this.gameService.currentPFH$.subscribe((pfh: number) => {
        this.currentPFH = pfh;
      }),
      this.gameService.gamePhase$.subscribe((phase: 'menu' | 'draft' | 'battle' | 'result') => {
        this.gamePhase = phase;
      })
    );
  }

  // Vérifie si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  // Gère la déconnexion
  logout(): void {
    this.authService.logout();
    this.gameService.resetGameState();
    this.router.navigate(['/']);
    this.isMenuOpen = false;
  }

  // Gère les actions des liens (comme la déconnexion)
  handleAction(action: string): void {
    if (action === 'logout') {
      this.logout();
    }
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
      : `Phase: ${this.translatePhase(this.gamePhase)} | PFH: ${this.currentPFH}`;
  }

  resetGame(): void {
    this.gameService.resetGameState();
    this.router.navigate(['/']);
  }


  private translatePhase(phase: string): string {
    const translations: Record<string, string> = {
      'draft': 'Tirage',
      'battle': 'Combat',
      'result': 'Résultat'
    };
    return translations[phase] || phase;
  }
}