import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';

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

  // Méthode isAuthenticated complète
  isAuthenticated(): boolean {
    const token = this.getAccessToken();

    // Vérifie la présence ET la validité du token
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  login(email: string, password: string): Observable<{ accessToken: string, refreshToken: string }> {
    return this.http.post<{
      accessToken: string,
      refreshToken: string
    }>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  register(username: string, email: string, password: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, {
      username,
      email,
      password
    });
  }

  storeUserData(accessToken: string, refreshToken: string, userId: string): void {
    this.storeTokens(accessToken, refreshToken);
    localStorage.setItem(this.USER_ID_KEY, userId);
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
  }

  refreshToken(refreshToken?: string): Observable<{ accessToken: string; refreshToken: string }> {
    const tokenToUse = refreshToken || this.getRefreshToken();

    if (!tokenToUse) {
      return of(); // Retourne un Observable vide si pas de refresh token disponible
    }

    return this.http.post<{
      accessToken: string;
      refreshToken: string;
    }>(`${environment.apiUrl}/auth/refresh`, { refreshToken: tokenToUse });
  }
  // Méthode supplémentaire pour décoder le token
  getDecodedToken(): any {
    const token = this.getAccessToken();
    return token ? this.jwtHelper.decodeToken(token) : null;
  }
}