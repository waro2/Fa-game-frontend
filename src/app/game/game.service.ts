import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { switchMap } from 'rxjs/operators';

interface Players {
  player1: string;
  player2: string;
}

interface QueueStatus {
  position: number;
  totalPlayers: number;
  avgWaitTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = environment.apiUrl;

  // Sujets pour le state management
  private playerNameSubject = new BehaviorSubject<string>('');
  private gameModeSubject = new BehaviorSubject<'quick' | 'private'>('quick');
  private roomCodeSubject = new BehaviorSubject<string>('');
  private currentPFHSubject = new BehaviorSubject<number>(0);
  private gamePhaseSubject = new BehaviorSubject<string>('menu');
  private playersSubject = new BehaviorSubject<Players | null>(null);

  // Observables
  playerName$ = this.playerNameSubject.asObservable();
  gameMode$ = this.gameModeSubject.asObservable();
  roomCode$ = this.roomCodeSubject.asObservable();
  currentPFH$ = this.currentPFHSubject.asObservable();
  gamePhase$ = this.gamePhaseSubject.asObservable();
  players$ = this.playersSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Méthodes de state management
  setPlayerName(name: string): void {
    this.playerNameSubject.next(name);
  }

  setGameMode(mode: 'quick' | 'private'): void {
    this.gameModeSubject.next(mode);
  }

  setRoomCode(code: string): void {
    this.roomCodeSubject.next(code);
  }

  setCurrentPFH(pfh: number): void {
    this.currentPFHSubject.next(pfh);
  }

  setGamePhase(phase: string): void {
    this.gamePhaseSubject.next(phase);
  }

  // Méthodes liées à l'API
  getPlayerNames(): Observable<Players> {
    if (!environment.production) {
      const mockPlayers = {
        player1: this.playerNameSubject.value || 'Joueur 1',
        player2: 'Joueur 2'
      };
      this.playersSubject.next(mockPlayers);
      return of(mockPlayers);
    }

    return this.http.get<Players>(`${this.apiUrl}/game/players`).pipe(
      switchMap(players => {
        this.playersSubject.next(players);
        return of(players);
      })
    );
  }

  joinMatchmaking(): Observable<{ opponent: string, game_id: string } | { status: string }> {
    const playerId = this.playerNameSubject.value;
    if (!playerId) {
      throw new Error('Player name must be set before joining matchmaking');
    }

    if (!environment.production) {
      return of({
        opponent: 'IA',
        game_id: 'mock-game-id'
      });
    }

    return this.http.post<{ opponent: string, game_id: string } | { status: string }>(
      `${this.apiUrl}/matchmaking`,
      { user_id: playerId }
    );
  }

  cancelMatchmaking(): Observable<{ success: boolean }> {
    if (!environment.production) {
      return of({ success: true });
    }

    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/matchmaking/cancel`,
      { user_id: this.playerNameSubject.value }
    );
  }

  getQueueStatus(): Observable<QueueStatus> {
    if (!environment.production) {
      return of({
        position: Math.floor(Math.random() * 5) + 1,
        totalPlayers: Math.floor(Math.random() * 20) + 5,
        avgWaitTime: Math.floor(Math.random() * 60) + 10
      });
    }

    return this.http.get<QueueStatus>(`${this.apiUrl}/matchmaking/queue-status`);
  }

  createPrivateGame(): Observable<{ roomCode: string }> {
    if (!environment.production) {
      const mockCode = 'PRIVATE-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      this.setRoomCode(mockCode);
      return of({ roomCode: mockCode });
    }

    return this.http.post<{ roomCode: string }>(
      `${this.apiUrl}/game/private/create`,
      { playerName: this.playerNameSubject.value }
    ).pipe(
      switchMap(response => {
        this.setRoomCode(response.roomCode);
        return of(response);
      })
    );
  }

  joinPrivateGame(roomCode: string): Observable<{ success: boolean }> {
    if (!environment.production) {
      this.setRoomCode(roomCode);
      return of({ success: true });
    }

    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/game/private/join`,
      {
        roomCode,
        playerName: this.playerNameSubject.value
      }
    ).pipe(
      switchMap(response => {
        if (response.success) {
          this.setRoomCode(roomCode);
        }
        return of(response);
      })
    );
  }

  resetGameState(): void {
    this.setPlayerName('');
    this.setGameMode('quick');
    this.setRoomCode('');
    this.setCurrentPFH(0);
    this.setGamePhase('menu');
    this.playersSubject.next(null);
  }
}