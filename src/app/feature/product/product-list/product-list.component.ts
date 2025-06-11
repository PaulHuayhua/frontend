import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/interfaces/product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    RouterModule,
    AlertComponent,
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'identifier', 'name', 'description', 'size', 'stock', 'price',
    'expiration_date', 'category', 'state', 'acciones'
  ];

  products: Product[] = [];
  dataSource = new MatTableDataSource<Product>([]);

  showAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' = 'info';

  private productService = inject(ProductService);
  private router = inject(Router);

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadProducts();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (data: Product, filter: string): boolean => {
      const lowerFilter = filter.trim().toLowerCase();
      return (
        data.name.toLowerCase().includes(lowerFilter) ||
        data.description.toLowerCase().includes(lowerFilter) ||
        data.category.toLowerCase().includes(lowerFilter)
      );
    };
  }

  loadProducts(): void {
    this.productService.findAll().subscribe((data: Product[]) => {
      this.products = data;
      this.dataSource.data = data;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  onEdit(product: Product) {
    this.router.navigate(['/product-form', product.identifier]);
  }

  onDelete(product: Product) {
    if (product.identifier === undefined) {
      this.setAlert('ID del producto no válido.', 'error');
      return;
    }

    if (confirm(`¿Desactivar producto ${product.name}?`)) {
      this.productService.updateState(product.identifier).subscribe({
        next: () => {
          this.setAlert('Producto desactivado correctamente', 'success');
          this.loadProducts();
        },
        error: (err: any) => {
          this.setAlert('Error al desactivar el producto. Revisa la consola.', 'error');
          console.error('Error updateState:', err);
        }
      });
    }
  }

  goProductForm() {
    this.router.navigate(['/product-form']);
  }

  setAlert(message: string, type: 'success' | 'error' | 'info') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
  }
}
