import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/interfaces/product';
import { Alert } from '../../../shared/components/alert/alert';
import { FriendlyDatePipe } from '../../../core/pipes/friendly-date.pipe';
import { PenCurrencyPipe } from '../../../core/pipes/pen-currency.pipe';
import { Colors } from '../../../core/directives/colors';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatTableModule,
    Alert,
    FriendlyDatePipe,
    PenCurrencyPipe,
    Colors
  ],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss']
})
export class ProductList implements OnInit {
  dataSource = new MatTableDataSource<Product>([]);
  private products: Product[] = [];

  totalProductos = 0;
  stockBajo = 0;
  sinStock = 0;

  estadoFiltro: 'todos' | 'activo' | 'inactivo' = 'todos';
  stockFiltro: 'todos' | 'bajo' | 'sin' | 'suficiente' = 'todos';
  textoFiltro = '';
  categoriaFiltro = 'todas';
  categorias: string[] = [];

  sortColumn: keyof Product | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  showAlert = false;
  confirmAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';
  productToDelete: Product | null = null;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  ngOnInit() {
    this.route.data.subscribe(({ products }) => {
      this.products = products;
      this.categorias = [...new Set(this.products.map(p => p.category))];
      this.applyAllFilters();
      this.calcularIndicadores();
    });
  }

  applyAllFilters(): void {
    let filtered = [...this.products];

    // Filtrar por estado
    if(this.estadoFiltro !== 'todos'){
      filtered = filtered.filter(p =>
        this.estadoFiltro === 'activo' ? p.state==='A' : p.state==='I'
      );
    }

    // Filtrar por categoría
    if(this.categoriaFiltro !== 'todas'){
      filtered = filtered.filter(p => p.category===this.categoriaFiltro);
    }

    // Filtrar por stock
    switch(this.stockFiltro){
      case 'bajo': filtered = filtered.filter(p => p.stock>0 && p.stock<=5); break;
      case 'sin': filtered = filtered.filter(p => p.stock===0); break;
      case 'suficiente': filtered = filtered.filter(p => p.stock>5); break;
    }

    // Filtrar por texto
    const texto = this.textoFiltro.trim().toLowerCase();
    if(texto){
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(texto) ||
        p.description.toLowerCase().includes(texto) ||
        p.category.toLowerCase().includes(texto)
      );
    }

    // Ordenar si hay columna seleccionada
    if(this.sortColumn){
      filtered.sort((a,b)=> this.compare(a,b,this.sortColumn!));
      if(this.sortDirection==='desc') filtered.reverse();
    }

    this.dataSource.data = filtered;
    this.calcularIndicadores();
  }

  applyFilter(event: Event){
    this.textoFiltro = (event.target as HTMLInputElement).value;
    this.applyAllFilters();
  }

  filtrarPorEstado(){ this.applyAllFilters(); }

  private calcularIndicadores(){
    this.totalProductos = this.products.length;
    this.stockBajo = this.products.filter(p => p.stock>0 && p.stock<=5).length;
    this.sinStock = this.products.filter(p => p.stock===0).length;
  }

  onEdit(product: Product){ 
    this.router.navigate(['form', product.identifier], {relativeTo: this.route}); 
  }

  onDelete(product: Product){
    this.alertMessage = `¿Estás seguro de desactivar el producto ${product.name}?`;
    this.alertType = 'warning';
    this.confirmAlert = true;
    this.showAlert = true;
    this.productToDelete = product;
  }

  onRestore(product: Product){
    this.alertMessage = `¿Estás seguro de restaurar el producto ${product.name}?`;
    this.alertType = 'info';
    this.confirmAlert = true;
    this.showAlert = true;
    this.productToDelete = product;
  }

  handleAlertConfirm(confirmed: boolean){
    if(confirmed && this.productToDelete){
      const id = this.productToDelete.identifier!;
      const esActivo = this.productToDelete.state==='A';
      const request$ = esActivo
        ? this.productService.updateState(id)
        : this.productService.restoreProduct(id);

      request$.subscribe({
        next: updated=>{
          this.products = this.products.map(p => p.identifier===updated.identifier ? updated : p);
          this.applyAllFilters();
          this.setAlert(esActivo ? 'Producto desactivado':'Producto restaurado','success');
        },
        error: err=>{
          console.error(err);
          this.setAlert('Error al actualizar el producto.','error');
        }
      });
    }
    this.showAlert=false;
    this.confirmAlert=false;
  }

  setAlert(message:string, type:'success'|'error'|'info'|'warning'){
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(()=>this.showAlert=false,3000);
  }

  reportPdf(){
    this.productService.reportPdf().subscribe(blob=>{
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_producto.pdf';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // =============================================
  // Ordenamiento general para todas las columnas
  // =============================================
  sortData(column: keyof Product){
    if(this.sortColumn===column){
      this.sortDirection = this.sortDirection==='asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyAllFilters();
  }

  private compare(a: Product, b: Product, column: keyof Product): number {
    const valA = a[column];
    const valB = b[column];

    // Comparar números
    if(typeof valA==='number' && typeof valB==='number') return valA-valB;

    // Comparar fechas
    if(valA instanceof Date && valB instanceof Date) return valA.getTime()-valB.getTime();

    // Comparar tamaño/volumen como número si existe
    if(column==='volumeWeight' && typeof valA==='number' && typeof valB==='number'){
      return valA-valB;
    }

    // Comparar strings
    return String(valA ?? '').localeCompare(String(valB ?? ''), 'es', { numeric:true });
  }
}
