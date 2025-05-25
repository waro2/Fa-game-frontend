import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../game/game.service';

@Component({
    selector: 'app-hero',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    constructor(
        private router: Router,
        private gameService: GameService
    ) { }

    startGame(): void {
        this.gameService.resetGameState();
        this.router.navigate(['/game']);
    }
}