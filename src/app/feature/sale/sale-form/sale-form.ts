import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SaleService } from '../../../core/services/sale.service';
import { ProductService } from '../../../core/services/product.service';
import { CustomerService } from '../../../core/services/customer';
import { UserService } from '../../../core/services/user.service';
import { Auth } from '../../../core/services/auth';
import { AlertService } from '../../../core/services/alert.service';
import { Sale, SaleDetail } from '../../../core/interfaces/sale';
import { Product } from '../../../core/interfaces/product';
import { Customer } from '../../../core/interfaces/customer';
import { User } from '../../../core/interfaces/user';
import { Alert } from '../../../shared/components/alert/alert';

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Alert],
  templateUrl: './sale-form.html',
  styleUrls: ['./sale-form.scss']
})
export class SaleForm implements OnInit {
  saleForm!: FormGroup;
  products: Product[] = [];
  customers: Customer[] = [];
  users: User[] = [];
  isEditMode = false;
  saleId?: number;
  
  currentUserId?: number;
  currentUserName: string = '';

  // Variables para el componente Alert (igual que en compras)
  showAlert: boolean = false;
  confirmAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';
  pendingSaleData: Sale | null = null;
  pendingDetailIndex: number | null = null;
  pendingCancelAction: boolean = false;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService,
    private customerService: CustomerService,
    private userService: UserService,
    private authService: Auth,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCurrentUser();
    this.loadProducts();
    this.loadCustomers();

    const sale = this.route.snapshot.data['sale'] as Sale | null;
    
    if (sale) {
      this.isEditMode = true;
      this.saleId = sale.identifier;
      this.loadSaleData(sale);
    } else {
      this.addDetail();
    }
  }

  initForm() {
    this.saleForm = this.fb.group({
      customerIdentifier: ['', Validators.required],
      userIdentifier: ['', Validators.required],
      paymentMethod: ['', Validators.required],
      details: this.fb.array([])
    });
  }

  loadCurrentUser() {
    const userFromToken = this.authService.getUserFromToken();
    
    if (!userFromToken?.name) {
      this.alertService.show('No se pudo obtener el usuario actual', 'error');
      this.router.navigate(['/login']);
      return;
    }

    this.userService.findByName(userFromToken.name).subscribe({
      next: (user) => {
        this.currentUserId = user.identifier;
        this.currentUserName = user.name;
        
        this.saleForm.patchValue({
          userIdentifier: user.identifier
        });
      },
      error: (err) => {
        console.error('Error al cargar usuario actual:', err);
        this.alertService.show('Error al cargar el usuario actual', 'error');
      }
    });
  }

  get details(): FormArray {
    return this.saleForm.get('details') as FormArray;
  }

  createDetail(): FormGroup {
    return this.fb.group({
      productIdentifier: ['', Validators.required],
      amount: [1, [Validators.required, Validators.min(1)]],
      stockAvailable: [{ value: 0, disabled: true }],
      subtotal: [{ value: 0, disabled: true }]
    });
  }

  addDetail() {
    this.details.push(this.createDetail());
  }

  removeDetail(index: number) {
    if (this.details.length > 1) {
      this.pendingDetailIndex = index;
      this.alertMessage = '¿Está seguro de eliminar este producto?';
      this.alertType = 'warning';
      this.confirmAlert = true;
      this.showAlert = true;
    } else {
      this.alertService.show('Debe haber al menos un detalle', 'warning');
    }
  }

  loadProducts() {
    this.productService.findAll().subscribe({
      next: (data) => {
        this.products = data.filter(p => p.state === 'A' && p.stock > 0);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.alertService.show('Error al cargar productos', 'error');
      }
    });
  }

  loadCustomers() {
    this.customerService.findByState('A').subscribe({
      next: (data) => this.customers = data,
      error: (err) => {
        console.error('Error al cargar clientes', err);
        this.alertService.show('Error al cargar clientes', 'error');
      }
    });
  }

  loadSaleData(sale: Sale) {
    this.saleForm.patchValue({
      customerIdentifier: sale.customerIdentifier,
      userIdentifier: sale.userIdentifier,
      paymentMethod: sale.paymentMethod
    });

    this.details.clear();
    
    sale.details.forEach(detail => {
      const detailGroup = this.createDetail();
      
      const product = this.products.find(p => p.identifier === detail.productIdentifier);
      const stock = product ? product.stock : 0;
      
      detailGroup.patchValue({
        productIdentifier: detail.productIdentifier,
        amount: detail.amount,
        stockAvailable: stock,
        subtotal: detail.subtotal
      });
      this.details.push(detailGroup);
    });
  }

  onProductChange(index: number) {
    const detail = this.details.at(index);
    const productId = detail.get('productIdentifier')?.value;
    const amount = detail.get('amount')?.value || 1;

    if (productId) {
      const product = this.products.find(p => p.identifier === Number(productId));
      if (product) {
        const subtotal = product.price * amount;
        const stock = product.stock;
        
        detail.patchValue({ 
          subtotal: subtotal,
          stockAvailable: stock
        });
        this.calculateTotal();
      }
    } else {
      detail.patchValue({ 
        subtotal: 0,
        stockAvailable: 0
      });
    }
  }

  onAmountChange(index: number) {
    this.onProductChange(index);
  }

  calculateTotal(): number {
    return this.details.controls.reduce((total, detail) => {
      return total + (detail.get('subtotal')?.value || 0);
    }, 0);
  }

  getProductName(productId: number): string {
    const product = this.products.find(p => p.identifier === productId);
    return product ? product.name : '';
  }

  getProductStock(productId: number): number {
    const product = this.products.find(p => p.identifier === productId);
    return product ? product.stock : 0;
  }

  onSubmit() {
    if (this.saleForm.invalid) {
      this.setAlert('Por favor complete todos los campos', 'warning');
      this.markFormGroupTouched(this.saleForm);
      return;
    }

    if (this.details.length === 0) {
      this.setAlert('Debe agregar al menos un producto', 'warning');
      return;
    }

    // Validar stock
    for (let i = 0; i < this.details.length; i++) {
      const detail = this.details.at(i);
      const productId = Number(detail.get('productIdentifier')?.value);
      const amount = Number(detail.get('amount')?.value);
      const stockAvailable = Number(detail.get('stockAvailable')?.value);

      if (amount > stockAvailable) {
        const productName = this.getProductName(productId);
        this.setAlert(
          `Stock insuficiente para ${productName}. Disponible: ${stockAvailable}`,
          'error'
        );
        return;
      }
    }

    const message = this.isEditMode 
      ? '¿Está seguro de actualizar esta venta?'
      : '¿Está seguro de registrar esta venta?';

    this.alertMessage = message;
    this.alertType = 'info';
    this.confirmAlert = true;
    this.showAlert = true;
    this.pendingSaleData = this.prepareSaleData();
  }

  private prepareSaleData(): Sale {
    const formValue = this.saleForm.getRawValue();

    return {
      ...formValue,
      identifier: this.saleId,
      customerIdentifier: Number(formValue.customerIdentifier),
      userIdentifier: Number(formValue.userIdentifier),
      details: formValue.details.map((d: any) => ({
        productIdentifier: Number(d.productIdentifier),
        amount: Number(d.amount)
      }))
    };
  }

  handleAlertConfirm(confirmed: boolean) {
    this.showAlert = false;
    this.confirmAlert = false;

    // Manejo de eliminación de detalle
    if (this.pendingDetailIndex !== null) {
      if (confirmed) {
        this.details.removeAt(this.pendingDetailIndex);
        this.calculateTotal();
        this.setAlert('Producto eliminado', 'success');
      }
      this.pendingDetailIndex = null;
      return;
    }

    // Manejo de cancelación
    if (this.pendingCancelAction) {
      if (confirmed) {
        this.router.navigate(['/sales']);
      }
      this.pendingCancelAction = false;
      return;
    }

    // Manejo de guardar/actualizar
    if (!confirmed || !this.pendingSaleData) return;

    const request = this.isEditMode 
      ? this.saleService.update(this.pendingSaleData)
      : this.saleService.save(this.pendingSaleData);

    request.subscribe({
      next: () => {
        const mensaje = this.isEditMode
          ? 'Venta actualizada correctamente'
          : 'Venta registrada correctamente';
        this.setAlert(mensaje, 'success');
        setTimeout(() => this.router.navigate(['/sales']), 1500);
      },
      error: (err) => {
        console.error('Error al guardar venta:', err);
        const errorMsg = err.error?.message || err.error || 'Error al guardar la venta';
        this.setAlert(errorMsg, 'error');
      }
    });

    this.pendingSaleData = null;
  }

  setAlert(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 3000);
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel() {
    if (this.saleForm.dirty) {
      this.pendingCancelAction = true;
      this.alertMessage = '¿Está seguro de cancelar? Los cambios no guardados se perderán.';
      this.alertType = 'warning';
      this.confirmAlert = true;
      this.showAlert = true;
    } else {
      this.router.navigate(['/sales']);
    }
  }
}