import { Route } from "@angular/router";
import { buysResolver } from "../../core/resolvers/buys.resolver";

export const routes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./buys-list/buys-list').then(c => c.BuysList),
    children: [
      {
        // Ruta hija para el modal - NO lleva guard
        path: 'view/:id',
        loadComponent: () =>
          import('./buys-view/buys-view').then(c => c.BuysView)
      }
    ]
  },
  {
    path: 'form',
    loadComponent: () =>
      import('./buys-form/buys-form').then(c => c.BuysForm),
    resolve: {
      buy: () => null
    }
  },
  {
    path: 'form/:id',
    loadComponent: () =>
      import('./buys-form/buys-form').then(c => c.BuysForm),
    resolve: {
      buy: buysResolver
    }
  }
];