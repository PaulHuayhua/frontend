export interface AuthRequest {
  name: string;
  passwordHash: string;
}

export interface AuthResponse {
  token: string;
}