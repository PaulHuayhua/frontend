import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Buy } from '../interfaces/buy';
import { BuysService } from '../services/buys.service';

export const buysResolver: ResolveFn<Buy | null> = (route, state) => {
  const buysService = inject(BuysService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));

  if (!id || isNaN(id)) {
    router.navigate(['/buys']);
    return of(null);
  }

  return buysService.findById(id).pipe(
    catchError((error) => {
      console.error('Error al cargar la compra:', error);
      router.navigate(['/buys']);
      return of(null);
    })
  );
};