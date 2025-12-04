import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { SaleService } from '../services/sale.service';
import { Sale } from '../interfaces/sale';

export const saleResolver: ResolveFn<Sale | null> = (route, state) => {
  const saleService = inject(SaleService);

  const id = route.paramMap.get('id');

  if (!id) return null;

  return saleService.findById(+id);
};
