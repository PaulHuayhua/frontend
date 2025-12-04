import { Routes } from '@angular/router';
import { productResolver } from '../../core/resolvers/product.resolver';

export const routes: Routes = [
  {
    path: '',
    resolve: { products: productResolver },
    loadComponent: () =>
      import('./product-list/product-list').then((c) => c.ProductList),
  },
  {
    path: 'form',
    loadComponent: () =>
      import('./product-form/product-form').then((c) => c.ProductForm),
  },
  {
    path: 'form/:id',
    loadComponent: () =>
      import('./product-form/product-form').then((c) => c.ProductForm),
  },
];