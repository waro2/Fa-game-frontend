import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private playerNameSubject = new BehaviorSubject<string>('');
  private gameModeSubject = new BehaviorSubject<'quick' | 'private'>('quick');
  private roomCodeSubject = new BehaviorSubject<string>('');
  private currentPFHSubject = new BehaviorSubject<number>(0);
  private gamePhaseSubject = new BehaviorSubject<string>('menu');

  // Observables
  playerName$ = this.playerNameSubject.asObservable();
  gameMode$ = this.gameModeSubject.asObservable();
  roomCode$ = this.roomCodeSubject.asObservable();
  currentPFH$ = this.currentPFHSubject.asObservable();
  gamePhase$ = this.gamePhaseSubject.asObservable();

  // Méthodes existantes
  setPlayerName(name: string): void {
    this.playerNameSubject.next(name);
  }

  setGameMode(mode: 'quick' | 'private'): void {
    this.gameModeSubject.next(mode);
  }

  setRoomCode(code: string): void {
    this.roomCodeSubject.next(code);
  }

  // Nouvelles méthodes pour le header
  setCurrentPFH(pfh: number): void {
    this.currentPFHSubject.next(pfh);
  }

  setGamePhase(phase: string): void {
    this.gamePhaseSubject.next(phase);
  }

  // Méthode utilitaire pour réinitialiser l'état
  resetGameState(): void {
    this.setPlayerName('');
    this.setGameMode('quick');
    this.setRoomCode('');
    this.setCurrentPFH(0);
    this.setGamePhase('menu');
  }
}