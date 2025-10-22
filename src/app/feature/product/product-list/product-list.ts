import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, ActivatedRoute} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { Alert } from '../../../shared/components/alert/alert';
import { ProductService } from '../../../core/services/product';
import { Product } from '../../../core/interfaces/product';
import { FriendlyDatePipe } from '../../../core/pipes/friendly-date.pipe';
import { PenCurrencyPipe } from '../../../core/pipes/pen-currency.pipe';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule,
    MatTableModule,
    Alert,
    FriendlyDatePipe,
    PenCurrencyPipe
  ],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss']
})
export class ProductList implements OnInit {
  dataSource = new MatTableDataSource<Product>([]);  
  displayedColumns: string[] = [
    'identifier', 'code', 'name', 'description', 'volumeWeight', 'unitMeasure', 'stock', 
    'price', 'expiration_date', 'category', 'state', 'acciones'
  ];

  // Lista original completa
  private products: Product[] = [];

  // Indicadores
  totalProductos: number = 0;
  productosActivos: number = 0;
  stockBajo: number = 0;
  sinStock: number = 0;
  valorTotal: number = 0;

  showAlert: boolean = false;
  confirmAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';
  productToDelete: Product | null = null;

  estadoFiltro: 'todos' | 'activo' | 'inactivo' = 'todos';
  textoFiltro: string = '';

  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.data.subscribe(({ products }) => {
      this.products = products;
      this.applyAllFilters();
      this.calcularIndicadores();
    });
  }


  loadProducts(): void {
    this.productService.findAll().subscribe((data: Product[]) => {
      this.products = data;
      this.applyAllFilters();
      this.calcularIndicadores();
    });
  }

  applyAllFilters(): void {
    let filtered = [...this.products];

    // Filtrado por estado
    filtered = filtered.filter(p => {
      if (this.estadoFiltro === 'todos') return true;
      if (this.estadoFiltro === 'activo') return p.state === 'A';
      if (this.estadoFiltro === 'inactivo') return p.state === 'I';
      return true;
    });

    // Filtrado por texto
    const texto = this.textoFiltro.trim().toLowerCase();
    if (texto) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(texto) ||
        p.description.toLowerCase().includes(texto) ||
        p.category.toLowerCase().includes(texto)
      );
    }

    this.dataSource.data = filtered;
    this.calcularIndicadores();
  }

  private calcularIndicadores(): void {
    this.totalProductos = this.products.length;
    this.productosActivos = this.products.filter(p => p.state === 'A').length;
    this.stockBajo = this.products.filter(p => p.stock > 0 && p.stock <= 5).length;
    this.sinStock = this.products.filter(p => p.stock === 0).length;
    this.valorTotal = this.products.reduce((acc, p) => acc + (p.stock * p.price), 0);
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
      const id = this.productToDelete.identifier!;
      const esActivo = this.productToDelete.state === 'A';

      const request$ = esActivo
        ? this.productService.updateState(id)
        : this.productService.restoreProduct(id);

      request$.subscribe({
        next: (updatedProduct) => {
          this.products = this.products.map(p =>
            p.identifier === updatedProduct.identifier ? updatedProduct : p
          );
          this.applyAllFilters();

          const mensaje = esActivo
            ? 'Producto desactivado correctamente'
            : 'Producto restaurado correctamente';
          this.setAlert(mensaje, 'success');

          this.productToDelete = null;
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

  reportPdf() {
    this.productService.reportPdf().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reporte_producto.pdf';
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  sortData(column: keyof Product) {
    if (!this.dataSource) return;

    this.dataSource.data.sort((a, b) => {
      const valA = a[column] ?? '';
      const valB = b[column] ?? '';
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB);
      }
      return (valA as any) > (valB as any) ? 1 : -1;
    });
  }
}
