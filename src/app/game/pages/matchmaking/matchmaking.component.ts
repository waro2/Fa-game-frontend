import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../game.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.scss']
})
export class MatchmakingComponent {
  playerName: string = '';
  selectedMode: 'quick' | 'private' = 'quick';
  roomCode: string = '';
  isLoading: boolean = false;
  statusMessage: string = '';

  constructor(
    private gameService: GameService,
    private router: Router
  ) { }

  joinQuickMatch(): void {
    if (!this.playerName.trim()) {
      this.statusMessage = 'Veuillez entrer votre nom';
      return;
    }

    this.isLoading = true;
    this.statusMessage = 'Recherche d\'un adversaire...';

    // Simulation de recherche (remplacer par un vrai appel API)
    setTimeout(() => {
      this.gameService.setPlayerName(this.playerName);
      this.gameService.setGameMode('quick');
      this.router.navigate(['/game']);
      this.isLoading = false;
    }, 2000);
  }

  createPrivateGame(): void {
    if (!this.playerName.trim()) {
      this.statusMessage = 'Veuillez entrer votre nom';
      return;
    }

    this.isLoading = true;
    this.roomCode = this.generateRoomCode();
    this.statusMessage = `Code de salon créé : ${this.roomCode}`;

    this.gameService.setPlayerName(this.playerName);
    this.gameService.setGameMode('private');
    this.gameService.setRoomCode(this.roomCode);
  }

  joinPrivateGame(): void {
    if (!this.playerName.trim() || !this.roomCode.trim()) {
      this.statusMessage = 'Veuillez entrer votre nom et le code du salon';
      return;
    }

    this.isLoading = true;
    this.statusMessage = 'Connexion au salon...';

    // Simulation de connexion (remplacer par un vrai appel API)
    setTimeout(() => {
      this.gameService.setPlayerName(this.playerName);
      this.gameService.setGameMode('private');
      this.gameService.setRoomCode(this.roomCode);
      this.router.navigate(['/game']);
      this.isLoading = false;
    }, 1500);
  }


  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  copyToClipboard(text: string): void {
    // Créer un élément textarea temporaire
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';  // Pour éviter le défilement indésirable
    document.body.appendChild(textarea);
    textarea.select();

    try {
      // Copier le texte
      const successful = document.execCommand('copy');
      this.statusMessage = successful
        ? 'Code copié dans le presse-papiers !'
        : 'Impossible de copier le code';
    } catch (err) {
      this.statusMessage = 'Erreur lors de la copie du code';
      console.error('Erreur de copie:', err);
    } finally {
      // Nettoyer
      document.body.removeChild(textarea);
    }
  }
}
