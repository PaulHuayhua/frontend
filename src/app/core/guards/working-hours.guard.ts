import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class WorkHoursGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const horaActual = new Date().getHours();
    const minutos = new Date().getMinutes();

    if (sessionStorage.getItem('dentroHorario') === 'true') {
      return true;
    }

    if (horaActual >= 8 && horaActual <= 23) {

      if (horaActual === 17 && minutos >= 45) {
        alert('⚠️ El horario de atención termina en menos de 15 minutos. Finaliza tus operaciones pronto.');
      }

      sessionStorage.setItem('dentroHorario', 'true');
      return true;
    } else {
      alert('⏰ El horario de atención ha terminado (8:00 AM - 6:00 PM).');
      this.router.navigate(['/product-list']);
      return false;
    }
  }
}
