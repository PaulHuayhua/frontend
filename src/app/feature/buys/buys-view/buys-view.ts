import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BuysService } from '../../../core/services/buys.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../../core/services/alert.service';
import { Buy } from '../../../core/interfaces/buy';
import { Product } from '../../../core/interfaces/product';
import { Supplier } from '../../../core/interfaces/supplier';
import { User } from '../../../core/interfaces/user';
import { FriendlyDatePipe } from '../../../core/pipes/friendly-date.pipe';
import { PenCurrencyPipe } from '../../../core/pipes/pen-currency.pipe';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-buys-view',
  standalone: true,
  imports: [CommonModule, FriendlyDatePipe, PenCurrencyPipe, MatIconModule],
  templateUrl: './buys-view.html',
  styleUrls: ['./buys-view.scss']
})
export class BuysView implements OnInit, OnDestroy {
  buy?: Buy;
  products: Map<number, Product> = new Map();
  supplierName?: string;
  userName?: string;
  loading = true;

  constructor(
    private buysService: BuysService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private userService: UserService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadBuy(id);
    } else {
      this.alertService.show('ID de compra inválido', 'error');
      this.closeModal();
    }
    
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    // Restaurar scroll del body al cerrar el modal
    document.body.style.overflow = 'auto';
  }

  loadBuy(id: number) {
    this.loading = true;
    
    this.buysService.findById(id).subscribe({
      next: (buy) => {
        this.buy = buy;
        this.loadRelatedData(buy);
      },
      error: (err) => {
        console.error('Error al cargar compra:', err);
        this.alertService.show('Error al cargar la compra', 'error');
        this.loading = false;
        setTimeout(() => this.closeModal(), 2000);
      }
    });
  }

  /**
   * Carga productos, proveedor y usuario en paralelo
   */
  loadRelatedData(buy: Buy) {
    const productIds = buy.details?.map(d => d.product_identifier) || [];
    
    if (!buy.supplier_identifier || !buy.user_identifier) {
      this.alertService.show('Datos de compra incompletos', 'warning');
      this.loading = false;
      return;
    }

    forkJoin({
      products: this.productService.findAll(),
      supplier: this.supplierService.findById(buy.supplier_identifier),
      user: this.userService.findById(buy.user_identifier)
    }).subscribe({
      next: ({ products, supplier, user }) => {
        // Guardar productos en el Map
        products.forEach(p => {
          if (p.identifier && productIds.includes(p.identifier)) {
            this.products.set(p.identifier, p);
          }
        });
        
        // Guardar nombres - supplier.findById retorna un array
        if (Array.isArray(supplier) && supplier.length > 0) {
          this.supplierName = supplier[0].company;
        } else if (supplier && 'company' in supplier) {
          this.supplierName = (supplier as Supplier).company;
        } else {
          this.supplierName = 'Proveedor no encontrado';
        }
        
        this.userName = user.name || 'Usuario no encontrado';
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
    const product = this.products.get(productId);
    return product?.name || 'Producto no encontrado';
  }

  getProductPrice(productId: number): number {
    const product = this.products.get(productId);
    return product?.price || 0;
  }

  getStatusName(status?: string): string {
    switch (status) {
      case 'R': return 'Recibido';
      case 'C': return 'Cancelado';
      default: return 'Desconocido';
    }
  }

  /**
   * Cerrar el modal y volver al listado (mantener la misma URL base)
   */
  closeModal() {
    // Navegar de vuelta al listado sin recargar
    this.router.navigate(['/buys'], { 
      queryParamsHandling: 'preserve',
      replaceUrl: true 
    });
  }

  editBuy() {
    if (this.buy?.identifier) {
      this.router.navigate(['/buys/form', this.buy.identifier]);
    }
  }

  downloadPdf() {
    if (!this.buy?.identifier) {
      this.alertService.show('No se puede descargar el PDF', 'warning');
      return;
    }
    
    this.buysService.reportPdf(this.buy.identifier).subscribe({
      next: (pdf) => {
        const blob = new Blob([pdf], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compra_${this.buy!.code || this.buy!.identifier}.pdf`;
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