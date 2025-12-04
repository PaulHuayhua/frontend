import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuysService } from '../../../core/services/buys.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../../core/services/alert.service';
import { Buy } from '../../../core/interfaces/buy';
import { Supplier } from '../../../core/interfaces/supplier';
import { User } from '../../../core/interfaces/user';
import { FriendlyDatePipe } from '../../../core/pipes/friendly-date.pipe';
import { PenCurrencyPipe } from '../../../core/pipes/pen-currency.pipe';
import { MatIconModule } from '@angular/material/icon';
import { Alert } from '../../../shared/components/alert/alert';
import { Colors } from '../../../core/directives/colors';

@Component({
  selector: 'app-buys-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    FriendlyDatePipe,
    PenCurrencyPipe,
    MatIconModule,
    Colors,
    Alert
  ],
  templateUrl: './buys-list.html',
  styleUrls: ['./buys-list.scss']
})
export class BuysList implements OnInit {
  buys: Buy[] = [];
  filteredBuys: Buy[] = [];
  suppliers: Supplier[] = [];
  users: User[] = [];

  filterStatus: string = '';
  searchCode: string = '';
  filterSupplier: string = '';
  filterUser: string = '';

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  showAlert: boolean = false;
  confirmAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';
  pendingAction: 'cancel' | 'restore' | null = null;
  selectedBuyId?: number;

  constructor(
    private buysService: BuysService,
    private supplierService: SupplierService,
    private userService: UserService,
    private alertService: AlertService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBuys();
    this.loadSuppliers();
    this.loadUsers();
  }

  loadBuys() {
    this.buysService.findAll().subscribe({
      next: (data) => {
        this.buys = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al cargar las compras:', err);
        this.alertService.show('Error al cargar las compras', 'error');
      }
    });
  }

  loadSuppliers() {
    this.supplierService.findAll().subscribe({
      next: (data) => (this.suppliers = data),
      error: (err) => console.error('Error al cargar proveedores:', err)
    });
  }

  loadUsers() {
    this.userService.getAll().subscribe({
      next: (data) => (this.users = data),
      error: (err) => console.error('Error al cargar usuarios:', err)
    });
  }

  applyFilters() {
    this.filteredBuys = this.buys.filter(buy => {
      const matchStatus = !this.filterStatus || buy.status === this.filterStatus;
      const matchCode = !this.searchCode ||
        buy.code?.toLowerCase().includes(this.searchCode.toLowerCase());
      const matchSupplier = !this.filterSupplier ||
        buy.supplier_identifier === Number(this.filterSupplier);
      const matchUser = !this.filterUser ||
        buy.user_identifier === Number(this.filterUser);

      return matchStatus && matchCode && matchSupplier && matchUser;
    });

    if (this.sortColumn) {
      this.filteredBuys.sort((a: any, b: any) => {
        const valA = a[this.sortColumn];
        const valB = b[this.sortColumn];

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  sortBy(column: string) {
    // Si se hace clic en la misma columna → alterna asc/desc
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applyFilters(); // vuelve a filtrar y ordenar
  }

  clearFilters() {
    this.filterStatus = '';
    this.searchCode = '';
    this.filterSupplier = '';
    this.filterUser = '';
    this.applyFilters();
  }

  getSupplierName(identifier?: number): string {
    if (!identifier) return 'Desconocido';
    return this.suppliers.find(s => s.identifier === identifier)?.company ?? 'Desconocido';
  }

  getUserName(identifier?: number): string {
    if (!identifier) return 'Desconocido';
    return this.users.find(u => u.identifier === identifier)?.name ?? 'Desconocido';
  }

  getStatusName(status?: string): string {
    switch (status) {
      case 'R': return 'Recibido';
      case 'C': return 'Cancelado';
      default: return 'Desconocido';
    }
  }

  getCountByStatus(status: string): number {
    return this.filteredBuys.filter(b => b.status === status).length;
  }

  newBuy() {
    this.router.navigate(['/buys/form']);
  }

  editBuy(id?: number) {
    if (!id) {
      this.alertService.show('ID de compra inválido', 'warning');
      return;
    }
    this.router.navigate(['/buys/form', id]);
  }


  viewBuy(id?: number) {
    if (!id) {
      this.alertService.show('ID de compra inválido', 'warning');
      return;
    }
    this.router.navigate(['/buys/view', id]);
  }

  cancelBuy(id?: number) {
    if (!id) return this.showAlertMessage('ID de compra inválido', 'warning');

    this.selectedBuyId = id;
    this.alertMessage = '¿Está seguro de cancelar esta compra?';
    this.alertType = 'warning';
    this.confirmAlert = true;
    this.showAlert = true;
    this.pendingAction = 'cancel';
  }

  restoreBuy(id?: number) {
    if (!id) return this.showAlertMessage('ID de compra inválido', 'warning');

    this.selectedBuyId = id;
    this.alertMessage = '¿Está seguro de restaurar esta compra?';
    this.alertType = 'info';
    this.confirmAlert = true;
    this.showAlert = true;
    this.pendingAction = 'restore';
  }

  handleAlertConfirm(confirmed: boolean) {
    if (!confirmed || !this.selectedBuyId || !this.pendingAction) {
      this.resetAlert();
      return;
    }

    const id = this.selectedBuyId;

    if (this.pendingAction === 'cancel') {
      this.buysService.softDelete(id).subscribe({
        next: () => this.showAlertMessage('Compra cancelada correctamente', 'success', 3000),
        error: () => this.showAlertMessage('Error al cancelar la compra', 'error', 3000),
        complete: () => this.loadBuys()
      });
    } else if (this.pendingAction === 'restore') {
      this.buysService.restore(id).subscribe({
        next: () => this.showAlertMessage('Compra restaurada correctamente', 'success', 3000),
        error: () => this.showAlertMessage('Error al restaurar la compra', 'error', 3000),
        complete: () => this.loadBuys()
      });
    }

    this.resetAlert();
  }

  private showAlertMessage(message: string, type: 'success' | 'error' | 'info' | 'warning', duration = 5000) {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    this.confirmAlert = false;

    if (duration > 0) {
      setTimeout(() => this.showAlert = false, duration);
    }
  }

  private resetAlert() {
    this.selectedBuyId = undefined;
    this.pendingAction = null;
    this.showAlert = false;
    this.confirmAlert = false;
  }


  downloadPdf(id?: number) {
    if (!id) {
      this.alertService.show('ID de compra inválido', 'warning');
      return;
    }

    this.buysService.reportPdf(id).subscribe({
      next: (pdf) => {
        const blob = new Blob([pdf], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const buy = this.buys.find(b => b.identifier === id);
        a.download = `compra_${buy?.code || id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.alertService.show('PDF descargado correctamente', 'success');
      },
      error: (err) => {
        console.error('Error al descargar PDF:', err);
        this.alertService.show('Error al descargar el PDF', 'error');
      }
    });
  }
}