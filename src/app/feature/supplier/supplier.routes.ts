import { Routes } from '@angular/router';
import { supplierDataResolver } from '../../core/resolvers/supplier.resolver';

export const routes: Routes = [
    {
    path: '',
    resolve: {
      suppliers: supplierDataResolver
    },
    loadComponent: () => import('./supplier-list/supplier-list').then(c => c.SupplierList)
  },
  {
    path: 'form',
    loadComponent: () => import('./supplier-form/supplier-form').then(c => c.SupplierForm)
  }
]