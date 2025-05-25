import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, switchMap, tap } from 'rxjs/operators';

// Types et interfaces améliorés
export type GameStatus = 'menu' | 'waiting' | 'ready' | 'in_progress' | 'finished';
export type GamePhase = 'draft' | 'battle' | 'result' | 'menu';
export type GameMode = 'quick' | 'private';

interface Players {
  player1: string;
  player2: string;
}

interface Game {
  id: string;
  status: GameStatus;
  phase: GamePhase;
  players: string[];
  roomCode?: string;
  currentPFH?: number;
}

interface QueueStatus {
  position: number;
  totalPlayers: number;
  avgWaitTime: number;
}

interface PrivateGameResponse {
  roomCode: string;
}

interface MatchmakingResponse {
  opponent: string;
  game_id: string;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private apiUrl = environment.apiUrl || '/api/games';

  // Sujets pour le state management
  private playerNameSubject = new BehaviorSubject<string>('');
  private gameModeSubject = new BehaviorSubject<GameMode>('quick');
  private roomCodeSubject = new BehaviorSubject<string>('');
  private currentPFHSubject = new BehaviorSubject<number>(0);
  private gameStatusSubject = new BehaviorSubject<GameStatus>('menu');
  private gamePhaseSubject = new BehaviorSubject<GamePhase>('menu');
  private playersSubject = new BehaviorSubject<Players | null>(null);
  private currentGameSubject = new BehaviorSubject<Game | null>(null);

  // Observables publics
  playerName$ = this.playerNameSubject.asObservable();
  gameMode$ = this.gameModeSubject.asObservable();
  roomCode$ = this.roomCodeSubject.asObservable();
  currentPFH$ = this.currentPFHSubject.asObservable();
  gameStatus$ = this.gameStatusSubject.asObservable();
  gamePhase$ = this.gamePhaseSubject.asObservable();
  players$ = this.playersSubject.asObservable();
  currentGame$ = this.currentGameSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkCurrentGame();
  }

  private checkCurrentGame(): void {
    const currentGameId = localStorage.getItem('current_game_id');
    if (currentGameId) {
      this.getGameById(currentGameId).subscribe({
        error: () => this.resetGameState()
      });
    }
  }

  // Méthodes de state management
  setPlayerName(name: string): void {
    this.playerNameSubject.next(name);
  }

  setGameMode(mode: GameMode): void {
    this.gameModeSubject.next(mode);
  }

  setRoomCode(code: string): void {
    this.roomCodeSubject.next(code);
  }

  setCurrentPFH(pfh: number): void {
    this.currentPFHSubject.next(pfh);
    const game = this.currentGameSubject.value;
    if (game) {
      this.currentGameSubject.next({ ...game, currentPFH: pfh });
    }
  }

  updateGameStatus(status: GameStatus): void {
    this.gameStatusSubject.next(status);
    const game = this.currentGameSubject.value;
    if (game) {
      this.currentGameSubject.next({ ...game, status });
    }
  }

  updateGamePhase(phase: GamePhase): void {
    this.gamePhaseSubject.next(phase);
    const game = this.currentGameSubject.value;
    if (game) {
      this.currentGameSubject.next({ ...game, phase });
    }
  }

  // Méthodes API
  createNewGame(): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/create`, {
      playerName: this.playerNameSubject.value
    }).pipe(
      tap(game => this.handleNewGame(game)),
      catchError(error => this.handleGameError(error))
    );
  }

  joinMatchmaking(): Observable<MatchmakingResponse> {
    return this.http.post<MatchmakingResponse>(
      `${this.apiUrl}/matchmaking`,
      { user_id: this.playerNameSubject.value }
    ).pipe(
      tap(response => this.handleMatchmakingResponse(response))
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

  createPrivateGame(): Observable<PrivateGameResponse> {
    if (!environment.production) {
      const mockCode = 'PRIVATE-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      this.setRoomCode(mockCode);
      return of({ roomCode: mockCode });
    }
    return this.http.post<PrivateGameResponse>(
      `${this.apiUrl}/game/private/create`,
      { playerName: this.playerNameSubject.value }
    );
  }

  joinPrivateGame(roomCode: string): Observable<{ success: boolean } | Game> {
    if (!environment.production) {
      this.setRoomCode(roomCode);
      return of({ success: true });
    }
    return this.http.post<Game>(
      `${this.apiUrl}/game/private/join`,
      { roomCode, playerName: this.playerNameSubject.value }
    );
  }

  getGameById(gameId: string): Observable<Game> {
    if (!environment.production) {
      const mockGame: Game = {
        id: gameId,
        status: 'in_progress',
        phase: 'battle',
        players: [this.playerNameSubject.value, 'Adversaire'],
        roomCode: this.roomCodeSubject.value,
        currentPFH: 0
      };
      this.setCurrentGame(mockGame);
      return of(mockGame);
    }

    return this.http.get<Game>(`${this.apiUrl}/games/${gameId}`).pipe(
      tap(game => this.setCurrentGame(game))
    );
  }

  leaveGame(): Observable<any> {
    const currentGame = this.currentGameSubject.value;

    if (!currentGame) {
      return of({ success: true });
    }

    if (!environment.production) {
      this.resetGameState();
      return of({ success: true });
    }

    return this.http.post(`${this.apiUrl}/games/${currentGame.id}/leave`, {
      playerName: this.playerNameSubject.value
    }).pipe(
      tap(() => this.resetGameState())
    );
  }

  private handleNewGame(game: Game): void {
    localStorage.setItem('current_game_id', game.id);
    this.setCurrentGame(game);
    if (game.roomCode) this.setRoomCode(game.roomCode);
  }

  private handleMatchmakingResponse(response: MatchmakingResponse): void {
    localStorage.setItem('current_game_id', response.game_id);
    this.getGameById(response.game_id).subscribe();
  }

  private setCurrentGame(game: Game): void {
    this.currentGameSubject.next(game);
    this.updateGameStatus(game.status);
    this.updateGamePhase(game.phase || 'menu');
    this.setCurrentPFH(game.currentPFH || 0);

    if (game.players?.length) {
      this.playersSubject.next({
        player1: game.players[0],
        player2: game.players[1] || ''
      });
    }
  }

  resetGameState(): void {
    localStorage.removeItem('current_game_id');
    this.currentGameSubject.next(null);
    this.playersSubject.next(null);
    this.updateGameStatus('menu');
    this.updateGamePhase('menu');
    this.setCurrentPFH(0);
    this.setRoomCode('');
  }

  private handleGameError(error: any): Observable<Game> {
    if (!environment.production) {
      const mockGame = this.createMockGame();
      this.handleNewGame(mockGame);
      return of(mockGame);
    }
    throw error;
  }

  private createMockGame(): Game {
    return {
      id: Math.random().toString(36).substr(2, 9),
      status: 'waiting',
      phase: 'menu',
      players: [this.playerNameSubject.value],
      currentPFH: 0
    };
  }
}