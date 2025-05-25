import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

import { AuthService } from '../../../auth/auth.service';
import { GameService } from '../../../game/game.service';
import { UserProfile } from '../../../shared/models/user.model';

interface QueueStatusResponse {
  position: number;
  totalPlayers: number;
  avgWaitTime: number;
}

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.scss']
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  // Propriétés utilisateur
  currentUser: UserProfile | null = null;
  playerName: string = '';

  // Propriétés de l'interface
  isLoading: boolean = false;
  error: string | null = null;
  statusMessage: string | null = null;
  selectedMode: 'quick' | 'private' = 'quick';

  // Propriétés du matchmaking rapide
  isInQueue: boolean = false;
  queuePosition: number | null = null;
  estimatedWaitTime: number | null = null;
  timeInQueue: number = 0;
  queueInterval: any;
  queueStatusInterval: any;

  // Propriétés du salon privé
  roomCode: string = '';

  // Propriétés du match trouvé
  isMatchFound: boolean = false;
  selectedOpponent: any | null = null;
  matchCountdown: number = 10;
  matchTimer: any;

  // Gestion des souscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();

    // S'abonner au nom du joueur dans le service
    this.subscriptions.push(
      this.gameService.playerName$.subscribe(name => {
        this.playerName = name;
      }),

      this.gameService.roomCode$.subscribe(code => {
        if (code) {
          this.roomCode = code;
        }
      }),

      this.gameService.gameStatus$.subscribe(status => {
        if (status === 'ready') {
          this.handleMatchFound();
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Nettoyer les intervalles
    this.clearAllTimers();

    // Désabonner de toutes les souscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Si on est en recherche de match, annuler
    if (this.isInQueue) {
      this.cancelMatchmaking();
    }
  }

  loadCurrentUser(): void {
    this.isLoading = true;

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        // Définir le nom du joueur dans le service
        this.gameService.setPlayerName(user.username || '');
        this.playerName = user.username || '';
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.error = "Impossible de charger votre profil. Veuillez vous reconnecter.";
        this.isLoading = false;
      }
    });
  }

  // Méthodes pour le mode Partie Rapide
  joinQuickMatch(): void {
    if (!this.playerName.trim()) {
      this.statusMessage = "Veuillez entrer votre nom avant de rechercher un adversaire.";
      return;
    }

    this.statusMessage = null;
    this.isLoading = true;
    this.gameService.setPlayerName(this.playerName);
    this.gameService.setGameMode('quick');

    this.gameService.joinMatchmaking().subscribe({
      next: (response) => {
        this.isLoading = false;

        if ('opponent' in response) {
          // Match trouvé immédiatement
          this.selectedOpponent = { username: response.opponent };
          this.handleMatchFound();
        } else {
          // En file d'attente
          this.isInQueue = true;
          this.startQueueTimer();
          this.pollQueueStatus();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la recherche de partie:', error);
        this.isLoading = false;
        this.statusMessage = "Erreur lors de la recherche d'un adversaire. Veuillez réessayer.";
      }
    });
  }

  cancelMatchmaking(): void {
    this.isLoading = true;

    this.gameService.cancelMatchmaking().subscribe({
      next: () => {
        this.isLoading = false;
        this.resetQueueState();
      },
      error: (error) => {
        console.error('Erreur lors de l\'annulation de la recherche:', error);
        this.isLoading = false;
        this.resetQueueState();
      }
    });
  }

  startQueueTimer(): void {
    this.timeInQueue = 0;
    this.queueInterval = setInterval(() => {
      this.timeInQueue++;
    }, 1000);
  }

  pollQueueStatus(): void {
    this.queueStatusInterval = setInterval(() => {
      this.gameService.getQueueStatus().subscribe({
        next: (status) => {
          this.queuePosition = status.position;
          this.estimatedWaitTime = status.avgWaitTime;

          // Si position est 1, on peut être le prochain à être matchmake
          if (status.position === 1) {
            // Augmenter la fréquence de polling
            clearInterval(this.queueStatusInterval);
            this.queueStatusInterval = setInterval(() => {
              this.checkForMatch();
            }, 1000);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la récupération de la position dans la file:', error);
        }
      });
    }, 5000); // Polling toutes les 5 secondes
  }

  checkForMatch(): void {
    // Vérifie si un match a été trouvé (dans un vrai système, vous auriez un endpoint API pour ça)
    this.gameService.currentGame$.subscribe({
      next: (game) => {
        if (game && game.status === 'ready' && game.players.length > 1) {
          this.resetQueueState();
          this.handleMatchFound();
        }
      }
    });
  }

  resetQueueState(): void {
    this.isInQueue = false;
    this.queuePosition = null;
    this.estimatedWaitTime = null;
    clearInterval(this.queueInterval);
    clearInterval(this.queueStatusInterval);
  }

  // Méthodes pour le mode Salon Privé
  createPrivateGame(): void {
    if (!this.playerName.trim()) {
      this.statusMessage = "Veuillez entrer votre nom avant de créer un salon.";
      return;
    }

    this.statusMessage = null;
    this.isLoading = true;
    this.gameService.setPlayerName(this.playerName);
    this.gameService.setGameMode('private');

    this.gameService.createPrivateGame().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.roomCode = response.roomCode;
        this.statusMessage = "Salon créé ! Partagez le code avec votre adversaire.";

        // Vérifier périodiquement si quelqu'un a rejoint la partie
        const checkJoinInterval = setInterval(() => {
          this.gameService.currentGame$.subscribe({
            next: (game) => {
              if (game && game.players.length > 1) {
                clearInterval(checkJoinInterval);
                this.handleMatchFound();
              }
            }
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur lors de la création du salon:', error);
        this.isLoading = false;
        this.statusMessage = "Erreur lors de la création du salon. Veuillez réessayer.";
      }
    });
  }

  joinPrivateGame(): void {
    if (!this.playerName.trim()) {
      this.statusMessage = "Veuillez entrer votre nom avant de rejoindre un salon.";
      return;
    }

    if (!this.roomCode.trim()) {
      this.statusMessage = "Veuillez entrer un code de salon.";
      return;
    }

    this.statusMessage = null;
    this.isLoading = true;
    this.gameService.setPlayerName(this.playerName);
    this.gameService.setGameMode('private');

    this.gameService.joinPrivateGame(this.roomCode).subscribe({
      next: (response) => {
        this.isLoading = false;

        if ('success' in response && response.success) {
          this.statusMessage = "Salon rejoint avec succès !";
          this.handleMatchFound();
        } else {
          this.statusMessage = "Salon rejoint avec succès !";
          this.handleMatchFound();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la connexion au salon:', error);
        this.isLoading = false;
        this.statusMessage = "Erreur lors de la connexion au salon. Code invalide ou salon complet.";
      }
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(
      () => {
        this.statusMessage = "Code copié dans le presse-papier !";
        setTimeout(() => {
          if (this.statusMessage === "Code copié dans le presse-papier !") {
            this.statusMessage = null;
          }
        }, 2000);
      },
      () => {
        this.statusMessage = "Impossible de copier le code. Veuillez le faire manuellement.";
      }
    );
  }

  // Gestion du match trouvé
  handleMatchFound(): void {
    this.isMatchFound = true;

    // Récupérer les informations sur le match
    this.gameService.players$.subscribe(players => {
      if (players) {
        // Déterminer qui est l'adversaire
        if (players.player1 === this.playerName) {
          this.selectedOpponent = { username: players.player2 };
        } else {
          this.selectedOpponent = { username: players.player1 };
        }

        // Démarrer le compte à rebours pour accepter
        this.startMatchCountdown();
      }
    });
  }

  startMatchCountdown(): void {
    this.matchCountdown = 10;
    this.matchTimer = interval(1000)
      .pipe(takeWhile(() => this.matchCountdown > 0))
      .subscribe(() => {
        this.matchCountdown--;

        if (this.matchCountdown <= 0) {
          this.cancelMatch();
        }
      });
  }

  acceptMatch(): void {
    if (this.matchTimer) {
      this.matchTimer.unsubscribe();
    }

    // Accepter le match et passer à la partie
    this.gameService.updateGameStatus('in_progress');
    this.router.navigate(['/game']);
  }

  cancelMatch(): void {
    if (this.matchTimer) {
      this.matchTimer.unsubscribe();
    }

    this.isMatchFound = false;
    this.selectedOpponent = null;

    // Annuler le match dans le service
    this.gameService.leaveGame().subscribe();
  }

  // Utilitaires
  clearAllTimers(): void {
    if (this.queueInterval) clearInterval(this.queueInterval);
    if (this.queueStatusInterval) clearInterval(this.queueStatusInterval);
    if (this.matchTimer) {
      this.matchTimer.unsubscribe();
    }
  }
}