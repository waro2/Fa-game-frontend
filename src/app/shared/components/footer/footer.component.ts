import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();
  gameVersion: string = '1.0.0';

  // Liens utiles
  usefulLinks = [
    { path: '/rules', label: 'Règles du jeu' },
    { path: '/about', label: 'À propos' },
    { path: '/contact', label: 'Contact' }
  ];

  // Liens sociaux
  socialLinks = [
    { icon: 'bi bi-twitter', url: 'https://twitter.com' },
    { icon: 'bi bi-discord', url: 'https://discord.com' },
    { icon: 'bi bi-github', url: 'https://github.com' }
  ];
}