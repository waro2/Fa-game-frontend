export interface UserProfile {
  id: number;
  username: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  avatar_url?: string;
  player_id?: number;
  games_played?: number;
  games_won?: number;
  pfh_balance?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: number;
  username: string;
  expires_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface User {
  id?: string | number;
  username: string;
  email?: string;
  // Ajoutez d'autres propriétés selon vos besoins
}