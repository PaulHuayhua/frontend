import { Routes } from '@angular/router';

import { DashboardComponent } from './feature/dashboard/dashboard.component';
import { SupplierFormComponent } from './feature/supplier/supplier-form/supplier-form.component';
import { SupplierListComponent } from './feature/supplier/supplier-list/supplier-list.component';
import { ProductFormComponent } from './feature/product/product-form/product-form.component';
import { ProductListComponent } from './feature/product/product-list/product-list.component';
import { PurchaseFormComponent } from './feature/purchase/purchase-form/purchase-form.component';
import { PurchaseListComponent } from './feature/purchase/purchase-list/purchase-list.component';
import { SaleFormComponent } from './feature/sale/sale-form/sale-form.component';
import { SaleListComponent } from './feature/sale/sale-list/sale-list.component';
import { LoginComponent } from './feature/auth/login/login.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: '',
        component: AdminLayoutComponent,
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'supplier-form', component: SupplierFormComponent },
            { path: 'supplier-list', component: SupplierListComponent },
            { path: 'product-form', component: ProductFormComponent },
            { path: 'product-form/:id', component: ProductFormComponent },
            { path: 'product-list', component: ProductListComponent },
            { path: 'purchase-form', component: PurchaseFormComponent },
            { path: 'purchase-list', component: PurchaseListComponent },
            { path: 'sale-form', component: SaleFormComponent },
            { path: 'sale-list', component: SaleListComponent },
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
