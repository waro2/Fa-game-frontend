import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../game.service';
import { FormsModule } from '@angular/forms';
import { interval, Subscription, takeWhile } from 'rxjs';
// import { TimeFormatPipe } from '../../../shared/pipes/time-format.pipe'; // Ajout de l'import

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.scss']
})
export class MatchmakingComponent implements OnDestroy {
  playerName: string = '';
  selectedMode: 'quick' | 'private' = 'quick';
  roomCode: string = '';
  isLoading: boolean = false;
  statusMessage: string = '';
  queuePosition: number | null = null;
  estimatedWaitTime: number | null = null;
  timeInQueue: number = 0;
  isInQueue: boolean = false;
  showAnimation: boolean = false;
  animationStates: string[] = [];
  private matchmakingSub!: Subscription;
  private queueTimerSub!: Subscription;
  private animationInterval!: any;
  private readonly MAX_WAIT_TIME = 120; // 2 minutes en secondes
  private readonly QUEUE_POLL_INTERVAL = 3000;


  constructor(
    private gameService: GameService,
    private router: Router
  ) { }

  joinQuickMatch(): void {
    if (!this.validatePlayerName()) return;

    this.isLoading = true;
    this.isInQueue = true;
    this.timeInQueue = 0;
    this.showAnimation = true;
    this.startAnimation();
    this.statusMessage = 'Recherche d\'un adversaire...';

    this.gameService.setPlayerName(this.playerName);
    this.gameService.setGameMode('quick');

    // Démarrer le timer d'attente
    this.startQueueTimer();

    // Premier appel immédiat
    this.checkMatchmakingStatus();

    // Configurer le polling régulier
    this.matchmakingSub = interval(this.QUEUE_POLL_INTERVAL).subscribe(() => {
      this.checkMatchmakingStatus();
    });

    // Simuler des données de file d'attente (à remplacer par un vrai appel API)
    this.simulateQueuePosition();
  }

  private checkMatchmakingStatus(): void {
    this.gameService.joinMatchmaking().subscribe({
      next: (response) => {
        if ('opponent' in response) {
          this.handleMatchFound(response.opponent, response.game_id);
        } else {
          this.updateQueueInfo();
        }
      },
      error: (err) => {
        console.error('Erreur lors du matchmaking:', err);
        this.handleMatchmakingError();
      }
    });
  }

  private updateQueueInfo(): void {
    // En production, vous pourriez obtenir ces infos depuis l'API
    if (this.timeInQueue > 30 && this.queuePosition && this.queuePosition > 1) {
      this.estimatedWaitTime = Math.floor(this.queuePosition * 0.5); // Estimation arbitraire
    }
  }

  private simulateQueuePosition(): void {
    // Simule une position dans la file qui diminue avec le temps
    setTimeout(() => {
      this.queuePosition = Math.floor(Math.random() * 10) + 1;

      const decreaseInterval = setInterval(() => {
        if (this.queuePosition && this.queuePosition > 0) {
          this.queuePosition -= 1;
        } else {
          clearInterval(decreaseInterval);
        }
      }, 5000);
    }, 2000);
  }

  cancelMatchmaking(): void {
    this.isLoading = false;
    this.isInQueue = false;
    this.showAnimation = false;
    this.queuePosition = null;
    this.estimatedWaitTime = null;
    this.timeInQueue = 0;

    if (this.matchmakingSub) {
      this.matchmakingSub.unsubscribe();
    }

    if (this.queueTimerSub) {
      this.queueTimerSub.unsubscribe();
    }

    clearInterval(this.animationInterval);
    this.statusMessage = 'Recherche annulée';

    // Appeler l'API pour annuler le matchmaking
    this.gameService.cancelMatchmaking().subscribe();
  }

  private startQueueTimer(): void {
    this.queueTimerSub = interval(1000).subscribe(() => {
      this.timeInQueue++;

      // Timeout après le temps maximum d'attente
      if (this.timeInQueue >= this.MAX_WAIT_TIME) {
        this.statusMessage = 'Délai d\'attente dépassé. Veuillez réessayer.';
        this.cancelMatchmaking();
      }
    });
  }

  private startAnimation(): void {
    this.animationStates = ['searching', 'searching.', 'searching..', 'searching...'];
    let index = 0;

    this.animationInterval = setInterval(() => {
      index = (index + 1) % this.animationStates.length;
      if (this.isInQueue) {
        this.statusMessage = this.animationStates[index];
      }
    }, 500);
  }

  private handleMatchFound(opponent: string, gameId: string): void {
    this.cleanupQueue();
    this.statusMessage = `Adversaire trouvé : ${opponent}`;
    this.gameService.setGamePhase('playing');
    this.router.navigate(['/game']);
  }

  private handleMatchmakingError(): void {
    this.cleanupQueue();
    this.statusMessage = 'Erreur lors de la recherche d\'adversaire';
  }

  private cleanupQueue(): void {
    this.isLoading = false;
    this.isInQueue = false;
    this.showAnimation = false;
    clearInterval(this.animationInterval);

    if (this.matchmakingSub) {
      this.matchmakingSub.unsubscribe();
    }

    if (this.queueTimerSub) {
      this.queueTimerSub.unsubscribe();
    }
  }

  createPrivateGame(): void {
    if (!this.validatePlayerName()) return;

    this.isLoading = true;
    this.statusMessage = 'Création du salon privé...';

    this.gameService.setPlayerName(this.playerName);
    this.gameService.setGameMode('private');

    this.gameService.createPrivateGame().subscribe({
      next: (response) => {
        this.roomCode = response.roomCode;
        this.gameService.setRoomCode(response.roomCode);
        this.statusMessage = `Salon créé - Code : ${response.roomCode}`;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la création du salon:', err);
        this.statusMessage = 'Erreur lors de la création du salon';
        this.isLoading = false;
      }
    });
  }

  joinPrivateGame(): void {
    if (!this.validatePlayerName()) return;
    if (!this.roomCode.trim()) {
      this.statusMessage = 'Veuillez entrer le code du salon';
      return;
    }

    this.isLoading = true;
    this.statusMessage = 'Connexion au salon...';

    this.gameService.setPlayerName(this.playerName);
    this.gameService.setGameMode('private');

    this.gameService.joinPrivateGame(this.roomCode).subscribe({
      next: (response) => {
        if (response.success) {
          this.gameService.setRoomCode(this.roomCode);
          this.gameService.getPlayerNames().subscribe(players => {
            this.statusMessage = `Connecté au salon - Joueurs: ${players.player1} vs ${players.player2}`;
            this.router.navigate(['/game']);
          });
        } else {
          this.statusMessage = 'Code de salon invalide ou salon plein';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la connexion au salon:', err);
        this.statusMessage = 'Erreur lors de la connexion au salon';
        this.isLoading = false;
      }
    });
  }

  private validatePlayerName(): boolean {
    if (!this.playerName.trim()) {
      this.statusMessage = 'Veuillez entrer votre nom';
      return false;
    }
    return true;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.statusMessage = 'Code copié dans le presse-papiers !';
    }).catch(err => {
      this.statusMessage = 'Erreur lors de la copie du code';
      console.error('Erreur de copie:', err);
    });
  }

  ngOnDestroy(): void {
    this.cleanupQueue(); // Utiliser la méthode existante qui nettoie tout    }
  }
}
