import { ErrorHandler, Injectable } from '@angular/core';
import { AlertService } from '../services/alert.service';
import { BusinessError } from '../errors/business-error';
import { NotFoundError } from '../errors/not-found-error';
import { UnauthorizedError } from '../errors/unauthorized-error';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private alert: AlertService) {}

  handleError(error: any): void {
    console.error('GLOBAL ERROR:', error);

    if (error instanceof BusinessError) {
      this.alert.show(error.message, 'warning');
      return;
    }

    if (error instanceof NotFoundError) {
      this.alert.show('Recurso no encontrado.', 'error');
      return;
    }

    if (error instanceof UnauthorizedError) {
      this.alert.show('No autorizado.', 'error');
      return;
    }

    // Cualquier error inesperado
    this.alert.show('Ocurrió un error inesperado.', 'error');
  }
}
