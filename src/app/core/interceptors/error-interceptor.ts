import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AlertService } from '../services/alert.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const alert = inject(AlertService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'Error desconocido';
      let type: 'error' | 'info' | 'warning' | 'success' = 'error';

      switch (err.status) {
        case 400:
          message = err.error?.message || 'Error de validación.';
          break;
        case 404:
          message = 'Recurso no encontrado.';
          break;
        case 401:
          message = 'Debes iniciar sesión.';
          break;
        case 403:
          message = 'No tienes permisos para esta acción.';
          break;
      }

      // Mostrar alerta usando AlertService
      alert.show(message, type);

      // Retornamos el error para que pueda ser usado si se desea
      return throwError(() => err);
    })
  );
};
