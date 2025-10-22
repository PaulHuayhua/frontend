import { Routes } from '@angular/router';
import { ProductList } from './feature/product/product-list/product-list';
import { ProductForm } from './feature/product/product-form/product-form';
import { AdminLayout } from './layout/admin-layout/admin-layout';

import { productResolver } from './core/resolvers/product.resolver';
import { authGuard } from './core/guards/auth.guard';
import { WorkHoursGuard } from './core/guards/working-hours.guard';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: 'product-list',
        component: ProductList,
        resolve: { products: productResolver },
        canActivate: [WorkHoursGuard]

      },
      {
        path: 'product-form',
        component: ProductForm,
        canActivate: [authGuard]
      },
      {
        path: 'product-form/:id',
        component: ProductForm,
        canActivate: [authGuard]
      },
      {
        path: '',
        redirectTo: 'product-list',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'product-list'
  }
];
