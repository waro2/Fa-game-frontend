import { Routes } from '@angular/router';
import { GameBoardComponent } from './pages/game-board/game-board.component';
import { MatchmakingComponent } from './pages/matchmaking/matchmaking.component';

export const GAME_ROUTES: Routes = [
  { path: '', component: GameBoardComponent },
  { path: 'matchmaking', component: MatchmakingComponent }
];
