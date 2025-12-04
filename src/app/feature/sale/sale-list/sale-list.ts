import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaleService } from '../../../core/services/sale.service';
import { CustomerService } from '../../../core/services/customer';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../../core/services/alert.service';
import { Sale } from '../../../core/interfaces/sale';
import { Customer } from '../../../core/interfaces/customer';
import { User } from '../../../core/interfaces/user';
import { FriendlyDatePipe } from '../../../core/pipes/friendly-date.pipe';
import { PenCurrencyPipe } from '../../../core/pipes/pen-currency.pipe';
import { MatIconModule } from '@angular/material/icon';
import { Colors } from '../../../core/directives/colors';
import { Alert } from '../../../shared/components/alert/alert';

@Component({
  selector: 'app-sale-list',
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
  templateUrl: './sale-list.html',
  styleUrls: ['./sale-list.scss']
})
export class SaleList implements OnInit {

  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  customers: Customer[] = [];
  users: User[] = [];

  // Filtros
  filterState: string = '';
  filterUser: string = '';
  searchCode: string = '';

  // Variables para ordenamiento
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Variables para el componente Alert
  showAlert: boolean = false;
  confirmAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';
  pendingAction: 'complete' | 'cancel' | 'restore' | null = null;
  selectedSaleId?: number;

  constructor(
    private saleService: SaleService,
    private customerService: CustomerService,
    private userService: UserService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadUsers();
    this.loadSales();
  }

  loadCustomers() {
    this.customerService.findAll().subscribe({
      next: (data) => this.customers = data,
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  loadUsers() {
    this.userService.getAll().subscribe({
      next: (data) => this.users = data,
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  loadSales() {
    this.saleService.findAll().subscribe({
      next: (data) => {
        this.sales = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.alertService.show('Error al cargar las ventas', 'error');
      }
    });
  }

  applyFilters() {
    // Primero filtrar
    this.filteredSales = this.sales.filter(sale => {
      const matchState = !this.filterState || sale.state === this.filterState;
      const matchUser = !this.filterUser || sale.userIdentifier === Number(this.filterUser);
      const matchCode = !this.searchCode || 
        sale.code?.toLowerCase().includes(this.searchCode.toLowerCase());
      return matchState && matchUser && matchCode;
    });

    // Luego ordenar si hay una columna seleccionada
    if (this.sortColumn) {
      this.sortData();
    }
  }

  /**
   * Ordena los datos según la columna y dirección actuales
   */
  sortData() {
    this.filteredSales.sort((a: any, b: any) => {
      let valA: any;
      let valB: any;

      // Obtener valores según la columna
      switch (this.sortColumn) {
        case 'code':
          valA = a.code || '';
          valB = b.code || '';
          break;
        
        case 'customerIdentifier':
          valA = this.getCustomerName(a.customerIdentifier);
          valB = this.getCustomerName(b.customerIdentifier);
          break;
        
        case 'userIdentifier':
          valA = this.getUserName(a.userIdentifier);
          valB = this.getUserName(b.userIdentifier);
          break;
        
        case 'issueDate':
          valA = new Date(a.issueDate || 0).getTime();
          valB = new Date(b.issueDate || 0).getTime();
          break;
        
        case 'total':
          valA = a.total || 0;
          valB = b.total || 0;
          break;
        
        case 'paymentMethod':
          valA = a.paymentMethod || '';
          valB = b.paymentMethod || '';
          break;
        
        case 'state':
          valA = this.getStateName(a.state);
          valB = this.getStateName(b.state);
          break;
        
        default:
          valA = a[this.sortColumn];
          valB = b[this.sortColumn];
      }

      // Comparar valores
      let comparison = 0;
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        // Comparación de texto (case-insensitive)
        comparison = valA.toLowerCase().localeCompare(valB.toLowerCase());
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        // Comparación numérica
        comparison = valA - valB;
      } else {
        // Comparación genérica
        if (valA < valB) comparison = -1;
        if (valA > valB) comparison = 1;
      }

      // Aplicar dirección de ordenamiento
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Maneja el clic en una columna para ordenar
   */
  sortBy(column: string) {
    // Si se hace clic en la misma columna → alterna asc/desc
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nueva columna → ordenar ascendente
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.sortData();
  }

  clearFilters() {
    this.filterState = '';
    this.filterUser = '';
    this.searchCode = '';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.applyFilters();
  }

  getStateName(state?: string): string {
    switch (state) {
      case 'P': return 'Pendiente';
      case 'F': return 'Completada';
      case 'C': return 'Cancelada';
      default: return 'Desconocido';
    }
  }

  getCountByState(state: string): number {
    return this.filteredSales.filter(s => s.state === state).length;
  }

  getCustomerName(id: number): string {
    const customer = this.customers.find(c => c.identifier === id);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Cliente desconocido';
  }

  getUserName(id: number): string {
    const user = this.users.find(u => u.identifier === id);
    return user ? `${user.name}` : 'Usuario desconocido';
  }

  newSale() {
    this.router.navigate(['/sales/form']);
  }

  editSale(id: number) {
    this.router.navigate(['/sales/form', id]);
  }

  viewSale(id: number) {
    this.router.navigate(['/sales/view', id]);
  }

  completeSale(id: number) {
    this.selectedSaleId = id;
    this.alertMessage = '¿Está seguro de completar esta venta?';
    this.alertType = 'warning';
    this.confirmAlert = true;
    this.showAlert = true;
    this.pendingAction = 'complete';
  }

  cancelSale(id: number) {
    this.selectedSaleId = id;
    this.alertMessage = '¿Está seguro de cancelar esta venta? Esta acción reducirá el stock.';
    this.alertType = 'warning';
    this.confirmAlert = true;
    this.showAlert = true;
    this.pendingAction = 'cancel';
  }

  restoreSale(id: number) {
    this.selectedSaleId = id;
    this.alertMessage = '¿Está seguro de restaurar esta venta a estado pendiente?';
    this.alertType = 'info';
    this.confirmAlert = true;
    this.showAlert = true;
    this.pendingAction = 'restore';
  }

  handleAlertConfirm(confirmed: boolean) {
    if (!confirmed || !this.selectedSaleId || !this.pendingAction) {
      this.resetAlert();
      return;
    }

    const id = this.selectedSaleId;

    switch (this.pendingAction) {
      case 'complete':
        this.saleService.complete(id).subscribe({
          next: () => {
            this.showAlertMessage('Venta completada correctamente', 'success', 3000);
            this.loadSales();
          },
          error: (err) => {
            console.error('Error al completar venta:', err);
            this.showAlertMessage(err.error || 'Error al completar la venta', 'error', 3000);
          }
        });
        break;

      case 'cancel':
        this.saleService.delete(id).subscribe({
          next: () => {
            this.showAlertMessage('Venta cancelada correctamente', 'success', 3000);
            this.loadSales();
          },
          error: (err) => {
            console.error('Error al cancelar venta:', err);
            this.showAlertMessage(err.error || 'Error al cancelar la venta', 'error', 3000);
          }
        });
        break;

      case 'restore':
        this.saleService.restore(id).subscribe({
          next: () => {
            this.showAlertMessage('Venta restaurada correctamente', 'success', 3000);
            this.loadSales();
          },
          error: (err) => {
            console.error('Error al restaurar venta:', err);
            this.showAlertMessage(err.error || 'Error al restaurar la venta', 'error', 3000);
          }
        });
        break;
    }

    this.resetAlert();
  }

  downloadPdf(customerId: number) {
    this.saleService.getSalesPdfByCustomer(customerId).subscribe({
      next: (pdf) => {
        const blob = new Blob([pdf], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ventas_cliente_${customerId}.pdf`;
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
    this.selectedSaleId = undefined;
    this.pendingAction = null;
    this.showAlert = false;
    this.confirmAlert = false;
  }
}