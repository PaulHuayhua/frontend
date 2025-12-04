import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  visible$ = new BehaviorSubject(false);
  message$ = new BehaviorSubject('');
  type$ = new BehaviorSubject<'success' | 'error' | 'info' | 'warning'>('info');
  confirm$ = new BehaviorSubject(false);
  
  // Subject para manejar la respuesta de confirmación
  confirmResponse$ = new Subject<boolean>();

  /**
   * Muestra una alerta simple
   */
  show(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 5000 // ms
  ) {
    this.message$.next(message);
    this.type$.next(type);
    this.confirm$.next(false);
    this.visible$.next(true);

    if (duration > 0) {
      setTimeout(() => this.close(), duration);
    }
  }

  /**
   * Muestra un diálogo de confirmación
   * @returns Promise que resuelve true si confirma, false si cancela
   */
  showConfirm(
    message: string,
    type: 'warning' | 'info' = 'warning'
  ): Promise<boolean> {
    this.message$.next(message);
    this.type$.next(type);
    this.confirm$.next(true);
    this.visible$.next(true);

    // Retornar una promesa que se resuelve cuando el usuario responde
    return new Promise<boolean>((resolve) => {
      const subscription = this.confirmResponse$.subscribe((result) => {
        resolve(result);
        subscription.unsubscribe();
      });
    });
  }

  /**
   * Envía la respuesta del usuario (true = confirmar, false = cancelar)
   */
  respond(result: boolean) {
    this.confirmResponse$.next(result);
    this.close();
  }

  /**
   * Cierra la alerta
   */
  close() {
    this.visible$.next(false);
    this.confirm$.next(false);
  }
}