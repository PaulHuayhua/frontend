import { inject, Injectable } from '@angular/core';
import { AuthRequest, AuthResponse } from '../interfaces/auth-login';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private http = inject(HttpClient);
  private urlBackEnd = `${environment.urlBackEnd}/v1/api/users`;

  // ------------------------------
  // LOGIN
  // ------------------------------
  login(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.urlBackEnd}/login`, credentials).pipe(
      tap((response: any) => {
        if (response?.token) {
          localStorage.setItem('token', response.token);
        }
        // Opcional: si la API devuelve el nombre y rol
        if (response?.name) {
          localStorage.setItem('userName', response.name);
        }
        if (response?.role) {
          localStorage.setItem('userRole', response.role);
        }
      })
    );
  }

  // ------------------------------
  // LOGOUT
  // ------------------------------
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
  }

  // ------------------------------
  // VALIDACIÓN
  // ------------------------------
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // ------------------------------
  // OBTENER TOKEN
  // ------------------------------
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // ------------------------------
  // OBTENER ROL DEL USUARIO
  // ------------------------------
  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }

  // ------------------------------
  // DECODIFICAR TOKEN JWT
  // ------------------------------
  private decodeToken(): any {
    const token = this.getToken();
    if (!token) return null;

    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;

    try {
      const decodedPayload = atob(payloadBase64);
      return JSON.parse(decodedPayload);
    } catch (e) {
      console.error('Error al decodificar token:', e);
      return null;
    }
  }

  // ------------------------------
  // OBTENER USUARIO DESDE EL TOKEN
  // ------------------------------
  getUserFromToken(): { name: string; role?: string } | null {
    const payload = this.decodeToken();
    if (!payload) return null;

    return {
      name: payload.sub || '',
      role: payload.role || this.getUserRole() || ''
    };
  }

  // ------------------------------
  // OBTENER INICIALES DEL USUARIO
  // ------------------------------
  getInitials(): string {
    const user = this.getUserFromToken();
    if (!user?.name) return 'UD';

    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
}