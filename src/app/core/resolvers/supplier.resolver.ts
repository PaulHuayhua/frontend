import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { SupplierService } from '../services/supplier.service';
import { Supplier } from '../interfaces/supplier';

export const supplierDataResolver: ResolveFn<Supplier[]> = (route, state) => {
  const supplierService = inject(SupplierService);
  return supplierService.findAll();
};
