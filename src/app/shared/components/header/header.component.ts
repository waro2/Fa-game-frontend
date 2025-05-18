import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GameService } from '../../../game/game.service';
import { Subscription } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';


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

  private readonly ACCESS_TOKEN_KEY = 'fà_access_token';
  private readonly REFRESH_TOKEN_KEY = 'fà_refresh_token';
  private readonly USER_ID_KEY = 'fà_user_id';
  private jwtHelper = new JwtHelperService();
  //notConnected = false;

  navigationLinks = [
    { path: '/', label: 'Accueil', icon: 'bi-house' },
    { path: '/game', label: 'Nouvelle Partie', icon: 'bi-plus-circle' },
    { path: '/matchmaking', label: 'Matchmaking', icon: 'bi-people' },
    { path: '/auth/profil', label: 'Profil', icon: 'bi-box-arrow-in-right' },
  ];

  connexionLinks = [
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

  // Vérification de l'authentification
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  // Getters pour les tokens
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
}
