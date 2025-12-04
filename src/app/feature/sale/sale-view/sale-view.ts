import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SaleService } from '../../../core/services/sale.service';
import { ProductService } from '../../../core/services/product.service';
import { CustomerService } from '../../../core/services/customer';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../../core/services/alert.service';
import { Sale } from '../../../core/interfaces/sale';
import { Product } from '../../../core/interfaces/product';
import { FriendlyDatePipe } from '../../../core/pipes/friendly-date.pipe';
import { PenCurrencyPipe } from '../../../core/pipes/pen-currency.pipe';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sale-view',
  standalone: true,
  imports: [CommonModule, FriendlyDatePipe, PenCurrencyPipe, MatIconModule],
  templateUrl: './sale-view.html',
  styleUrls: ['./sale-view.scss']
})
export class SaleView implements OnInit, OnDestroy {
  sale?: Sale;
  products: Map<number, Product> = new Map();
  customerName?: string;
  userName?: string;
  loading = true;

  constructor(
    private saleService: SaleService,
    private productService: ProductService,
    private customerService: CustomerService,
    private userService: UserService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadSale(id);
    }
    
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    // Restaurar scroll del body al cerrar el modal
    document.body.style.overflow = 'auto';
  }

  loadSale(id: number) {
    this.loading = true;
    
    this.saleService.findById(id).subscribe({
      next: (sale) => {
        this.sale = sale;
        this.loadRelatedData(sale);
      },
      error: (err) => {
        console.error('Error al cargar venta:', err);
        this.alertService.show('Error al cargar la venta', 'error');
        this.closeModal();
      }
    });
  }

  /**
   * Carga productos, cliente y usuario en paralelo
   */
  loadRelatedData(sale: Sale) {
    const productIds = sale.details.map(d => d.productIdentifier);

    forkJoin({
      products: this.productService.findAll(),
      customer: this.customerService.findById(sale.customerIdentifier),
      user: this.userService.findById(sale.userIdentifier)
    }).subscribe({
      next: ({ products, customer, user }) => {
        // Guardar productos
        products.forEach(p => {
          if (productIds.includes(p.identifier!)) {
            this.products.set(p.identifier!, p);
          }
        });

        // Guardar nombres
        this.customerName = `${customer.firstName} ${customer.lastName}`;
        this.userName = user.name;

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos relacionados:', err);
        this.loading = false;
        this.alertService.show('Error al cargar información adicional', 'warning');
      }
    });
  }

  getProductName(productId: number): string {
    return this.products.get(productId)?.name || 'Producto no encontrado';
  }

  getProductPrice(productId: number): number {
    return this.products.get(productId)?.price || 0;
  }

  getStateName(state?: string): string {
    switch (state) {
      case 'P': return 'Pendiente';
      case 'F': return 'Completada';
      case 'C': return 'Cancelada';
      default: return 'Desconocido';
    }
  }

  /**
   * Cerrar el modal y volver al listado (mantener la misma URL base)
   */
  closeModal() {
    // Navegar de vuelta al listado sin recargar
    this.router.navigate(['/sales'], { 
      queryParamsHandling: 'preserve',
      replaceUrl: true 
    });
  }

  editSale() {
    if (this.sale?.identifier) {
      this.router.navigate(['/sales/form', this.sale.identifier]);
    }
  }

  downloadPdf() {
    if (!this.sale) return;

    this.saleService.getSalesPdfByCustomer(this.sale.customerIdentifier).subscribe({
      next: (pdf) => {
        const blob = new Blob([pdf], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ventas_cliente_${this.sale?.customerIdentifier}.pdf`;
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