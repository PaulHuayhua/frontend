import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Auth } from '../services/auth';
import { environment } from '../../../environments/environment';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);
  const http = inject(HttpClient);

  // Si no hay token, redirigir al login
  const token = authService.getToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // Obtener los roles permitidos de la ruta
  const allowedRoles = route.data['roles'] as string[];

  // Si no hay roles definidos en la ruta, permitir acceso
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Primero intentar obtener el rol desde localStorage (más rápido)
  const cachedRole = authService.getUserRole();
  
  if (cachedRole) {
    // Si el rol está en cache, verificar directamente
    if (allowedRoles.includes(cachedRole)) {
      return true;
    } else {
      console.warn('⚠️ Acceso denegado: rol', cachedRole, 'no está en', allowedRoles);
      router.navigate(['/dashboard']);
      return false;
    }
  }

  // Si no hay rol en cache, obtenerlo del backend
  return http.get<{ role: string }>(`${environment.urlBackEnd}/v1/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  }).pipe(
    map((user) => {
      // Guardar el rol en localStorage para futuras verificaciones
      localStorage.setItem('userRole', user.role);

      // Verificar si el rol del usuario está en los roles permitidos
      if (allowedRoles.includes(user.role)) {
        console.log('✅ Acceso permitido: rol', user.role);
        return true;
      } else {
        console.warn('⚠️ Acceso denegado: rol', user.role, 'no está en', allowedRoles);
        router.navigate(['/dashboard']);
        return false;
      }
    }),
    catchError((error) => {
      console.error('❌ Error al validar rol del usuario:', error);
      router.navigate(['/login']);
      return of(false);
    })
  );
};