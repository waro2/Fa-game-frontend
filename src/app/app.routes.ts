import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard'; // Modifié ici
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { GameBoardComponent } from './game/pages/game-board/game-board.component';
import { MatchmakingComponent } from './game/pages/matchmaking/matchmaking.component';
import { HomeComponent } from './home/home.component';
import { AUTH_ROUTES } from './auth/auth.routes';

export const routes: Routes = [
  // Page d'accueil
  {
    path: 'home',
    component: HomeComponent
  },


  {
    path: 'auth',
    children: AUTH_ROUTES
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'game',
    component: GameBoardComponent,
    //canActivate: [AuthGuard] // Modifié ici
  },
  {
    path: 'matchmaking',
    component: MatchmakingComponent,
    // canActivate: [AuthGuard] // Modifié ici
    //
  },

];