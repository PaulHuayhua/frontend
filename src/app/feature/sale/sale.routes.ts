import { Route } from "@angular/router";
import { saleResolver } from "../../core/resolvers/sale.resolver";

export const routes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./sale-list/sale-list').then(c => c.SaleList),
    children: [
      {
        // Ruta hija para el modal - NO lleva guard
        path: 'view/:id',
        loadComponent: () =>
          import('./sale-view/sale-view').then(c => c.SaleView)
      }
    ]
  },
  {
    path: 'form',
    loadComponent: () =>
      import('./sale-form/sale-form').then(c => c.SaleForm),
    resolve: {
      sale: () => null   // Nuevo → el resolver no se usa
    }
  },
  {
    path: 'form/:id',
    loadComponent: () =>
      import('./sale-form/sale-form').then(c => c.SaleForm),
    resolve: {
      sale: saleResolver   // EDITAR → carga la venta antes de abrir
    }
  }
];