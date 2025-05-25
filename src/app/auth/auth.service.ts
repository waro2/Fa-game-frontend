import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { map } from 'rxjs/operators';
import { UserProfile } from '../shared/models/user.model';

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'fà_access_token';
  private readonly REFRESH_TOKEN_KEY = 'fà_refresh_token';
  private readonly USER_ID_KEY = 'fà_user_id';
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) { }

  // Stockage sécurisé des tokens
  public storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  // Vérification de l'authentification
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  // Getters pour les tokens
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Login avec gestion d'erreur améliorée
  login(email: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    return this.http.post(
      `${environment.apiUrl}/auth/login`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      }
    ).pipe(
      tap((response: any) => {
        if (response.accessToken && response.refreshToken) {
          this.storeTokens(response.accessToken, response.refreshToken);
        }
      }),
      catchError(error => {
        this.clearTokens();
        return throwError(() => error);
      })
    );
  }

  // Enregistrement avec typage fort
  register(username: string, email: string, password: string, confirm_password: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, {
      username,
      email,
      password,
      confirm_password
    }).pipe(
      tap(response => {
        if (response.accessToken && response.refreshToken) {
          this.storeUserData(response.accessToken, response.refreshToken, response.userId);
        }
      })
    );
  }

  // Stockage des données utilisateur
  storeUserData(accessToken: string, refreshToken: string, userId: string): void {
    this.storeTokens(accessToken, refreshToken);
    localStorage.setItem(this.USER_ID_KEY, userId);
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  // Rafraîchissement du token avec gestion d'erreur
  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post(`${environment.apiUrl}/auth/refresh`,
      { refresh_token: refreshToken },
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    ).pipe(
      tap((response: any) => {
        if (response.access_token && response.refresh_token) {
          this.storeTokens(response.access_token, response.refresh_token);
        }
      }),
      catchError(error => {
        this.clearTokens();
        return throwError(() => error);
      })
    );
  }

  // Déconnexion
  logout(): void {
    this.clearTokens();
    localStorage.removeItem(this.USER_ID_KEY);
  }

  // Nettoyage des tokens
  private clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // Décodage du token
  getDecodedToken(): any {
    const token = this.getAccessToken();
    return token ? this.jwtHelper.decodeToken(token) : null;
  }

  // Récupération de l'utilisateur courant
  getCurrentUser(): Observable<UserProfile> {
    const token = this.getAccessToken();

    if (!token) {
      return throwError(() => new Error('No access token available'));
    }

    return this.http.get<any>(`${environment.apiUrl}/auth/me`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    }).pipe(
      map(response => ({
        id: response.id || response._id || this.getUserId() || '',
        username: response.username || response.login || response.userName || '',
        name: response.name || response.display_name || response.full_name || '',
        email: response.email || '',
        avatar: response.avatar || response.picture || response.image_url || undefined,
        createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
        lastLogin: response.lastLogin ? new Date(response.lastLogin) : undefined,
        stats: response.stats ? {
          gamesPlayed: response.stats.gamesPlayed || 0,
          wins: response.stats.wins || 0,
          losses: response.stats.losses || 0,
          winRate: response.stats.winRate || 0
        } : undefined
      })),
      catchError(error => {
        if (error.status === 401) {
          this.clearTokens();
        }
        return throwError(() => error);
      })
    );
  }



}