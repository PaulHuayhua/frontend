import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/interfaces/product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatButtonToggleModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
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

  allProducts: Product[] = [];           // todos los productos desde el backend
  filteredProducts: Product[] = [];      // productos tras aplicar filtro
  dataSource = new MatTableDataSource<Product>([]);

  showAlert: boolean = false;
  confirmAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';
  productToDelete: Product | null = null;

  estadoFiltro: 'todos' | 'activo' | 'inactivo' = 'todos';
  textoFiltro: string = '';

  private productService = inject(ProductService);
  private router = inject(Router);

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadProducts();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }


  loadProducts(): void {
    this.productService.findAll().subscribe((data: Product[]) => {
      this.allProducts = data;
      this.applyAllFilters();
      this.dataSource.sort = this.sort;
    });
  }


  applyAllFilters(): void {
    // Filtrado por estado
    this.filteredProducts = this.allProducts.filter(p => {
      if (this.estadoFiltro === 'todos') return true;
      const activo = this.estadoFiltro === 'activo';
      return p.state === activo;
    });

    // Filtrado por texto
    const texto = this.textoFiltro.trim().toLowerCase();
    if (texto) {
      this.filteredProducts = this.filteredProducts.filter(p =>
        p.name.toLowerCase().includes(texto) ||
        p.description.toLowerCase().includes(texto) ||
        p.category.toLowerCase().includes(texto)
      );
    }

    // ✅ En vez de crear un nuevo MatTableDataSource, actualizamos los datos
    this.dataSource.data = this.filteredProducts;
  }


  applyFilter(event: Event) {
    this.textoFiltro = (event.target as HTMLInputElement).value;
    this.applyAllFilters();
  }

  filtrarPorEstado() {
    this.applyAllFilters();
  }

  onEdit(product: Product) {
    this.router.navigate(['/product-form', product.identifier]);
  }

  onDelete(product: Product) {
    this.alertMessage = `¿Estás seguro de desactivar el producto ${product.name}?`;
    this.alertType = 'warning';
    this.confirmAlert = true;
    this.showAlert = true;
    this.productToDelete = product;
  }

  onRestore(product: Product) {
    this.alertMessage = `¿Estás seguro de restaurar el producto ${product.name}?`;
    this.alertType = 'info';
    this.confirmAlert = true;
    this.showAlert = true;
    this.productToDelete = product;
  }


  handleAlertConfirm(confirmed: boolean) {
    if (confirmed && this.productToDelete) {
      const id = this.productToDelete.identifier;
      const esActivo = this.productToDelete.state;

      const request$ = esActivo
        ? this.productService.updateState(id)
        : this.productService.restoreProduct(id);

      request$.subscribe({
        next: () => {
          const nuevoEstado = !esActivo;
          const mensaje = nuevoEstado
            ? 'Producto restaurado correctamente'
            : 'Producto desactivado correctamente';
          this.setAlert(mensaje, 'success');
          this.productToDelete = null;
          this.loadProducts();
        },
        error: (err) => {
          this.setAlert('Error al actualizar el estado del producto.', 'error');
          console.error(err);
        }
      });
    }

    this.showAlert = false;
    this.confirmAlert = false;
  }


  handleCancel() {
    this.confirmAlert = false;
    this.productToDelete = null;
    this.showAlert = false;
  }

  setAlert(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.showAlert = false;
    setTimeout(() => {
      this.alertMessage = message;
      this.alertType = type;
      this.showAlert = true;
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
    }, 0);
  }

  goProductForm() {
    this.router.navigate(['/product-form']);
  }
}
