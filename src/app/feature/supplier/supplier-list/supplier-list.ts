import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SupplierService } from '../../../core/services/supplier.service';
import { Supplier } from '../../../core/interfaces/supplier';
import { CellNumberPipe } from '../../../core/pipes/cell-number.pipe';
import { FriendlyDatePipe } from '../../../core/pipes/friendly-date.pipe';
import { Colors } from '../../../core/directives/colors';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Alert } from '../../../shared/components/alert/alert';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonToggleModule,
    MatButtonModule,
    CellNumberPipe,
    FriendlyDatePipe,
    Colors,
    Alert
  ],
  templateUrl: './supplier-list.html',
  styleUrls: ['./supplier-list.scss']
})
export class SupplierList implements OnInit {
  allSuppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];

  textoFiltro: string = '';
  estadoFiltro: 'todos' | 'A' | 'I' = 'todos';
  categoriaFiltro: string = 'todas';
  rucFiltro: string = '';
  categorias: string[] = [];

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  showAlert: boolean = false;
  confirmAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';
  supplierToUpdate: Supplier | null = null;
  accionPendiente: 'eliminar' | 'restaurar' | null = null;

  totalSuppliers: number = 0;
  totalActivos: number = 0;
  totalInactivos: number = 0;

  private supplierService = inject(SupplierService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    const suppliersFromResolver = this.route.snapshot.data['suppliers'] as Supplier[];
    if (suppliersFromResolver) {
      this.allSuppliers = suppliersFromResolver;
      this.filteredSuppliers = [...suppliersFromResolver];
      this.updateCounters();
      this.categorias = Array.from(new Set(this.allSuppliers.map(s => s.category))).sort();
    }
    this.applyAllFilters();
  }

  updateCounters(): void {
    this.totalSuppliers = this.allSuppliers.length;
    this.totalActivos = this.allSuppliers.filter(s => s.state === 'A').length;
    this.totalInactivos = this.allSuppliers.filter(s => s.state === 'I').length;
  }

  applyAllFilters(): void {
    let result = [...this.allSuppliers];

    const texto = this.textoFiltro.trim().toLowerCase();
    if (texto) {
      result = result.filter(s =>
        s.company.toLowerCase().includes(texto) ||
        s.category.toLowerCase().includes(texto) ||
        s.address.toLowerCase().includes(texto)
      );
    }

    const rucTexto = this.rucFiltro.trim();
    if (rucTexto) {
      result = result.filter(s => s.ruc.includes(rucTexto));
    }

    if (this.estadoFiltro !== 'todos') {
      result = result.filter(s => s.state === this.estadoFiltro);
    }

    if (this.categoriaFiltro !== 'todas') {
      result = result.filter(s => s.category === this.categoriaFiltro);
    }

    if (this.sortColumn) {
      result.sort((a, b) => this.compare(a, b, this.sortColumn));
      if (this.sortDirection === 'desc') result.reverse();
    }

    this.filteredSuppliers = result;
  }

  applyFilter(event: Event): void {
    this.textoFiltro = (event.target as HTMLInputElement).value;
    this.applyAllFilters();
  }

  onEdit(supplier: Supplier): void {
    this.supplierService.setSelectedSupplier(supplier);
    this.router.navigate(['suppliers', 'form']);
  }

  onDelete(identifier: number): void {
    this.supplierToUpdate = this.allSuppliers.find(s => s.identifier === identifier) || null;
    this.alertMessage = `¿Deseas eliminar este proveedor?`;
    this.alertType = 'warning';
    this.confirmAlert = true;
    this.showAlert = true;
    this.accionPendiente = 'eliminar';
  }

  onRestore(identifier: number): void {
    this.supplierToUpdate = this.allSuppliers.find(s => s.identifier === identifier) || null;
    this.alertMessage = `¿Deseas restaurar este proveedor?`;
    this.alertType = 'info';
    this.confirmAlert = true;
    this.showAlert = true;
    this.accionPendiente = 'restaurar';
  }

  handleAlertConfirm(confirmed: boolean): void {
    if (confirmed && this.supplierToUpdate) {
      const id = this.supplierToUpdate.identifier;
      const accion = this.accionPendiente;

      const request$ = accion === 'eliminar'
        ? this.supplierService.delete(id)
        : this.supplierService.restore(id);

      request$.subscribe({
        next: () => {
          const index = this.allSuppliers.findIndex(s => s.identifier === id);
          if (index !== -1) this.allSuppliers[index].state = accion === 'eliminar' ? 'I' : 'A';
          this.applyAllFilters();
          this.updateCounters();
          const mensaje = accion === 'eliminar'
            ? 'Proveedor eliminado correctamente'
            : 'Proveedor restaurado correctamente';
          this.setAlert(mensaje, 'success');
        },
        error: () => {
          const mensaje = accion === 'eliminar'
            ? 'Error al eliminar el proveedor'
            : 'Error al restaurar el proveedor';
          this.setAlert(mensaje, 'error');
        }
      });
    }
    this.supplierToUpdate = null;
    this.accionPendiente = null;
    this.showAlert = false;
    this.confirmAlert = false;
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyAllFilters();
  }

  compare(a: any, b: any, column: string): number {
    const valueA = (a[column] ?? '').toString().toLowerCase();
    const valueB = (b[column] ?? '').toString().toLowerCase();
    return valueA.localeCompare(valueB, 'es', { numeric: true });
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

  goSupplierForm(): void {
    this.supplierService.setSelectedSupplier(null);
    this.router.navigate(['suppliers', 'form']);
  }

  reportPdf() {
    this.supplierService.reportPdf().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reporte.pdf';
      link.click();
      URL.revokeObjectURL(url);
    });
  }
}
