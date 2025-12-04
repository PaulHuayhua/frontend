import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BuysService } from '../../../core/services/buys.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../../core/services/alert.service';
import { Auth } from '../../../core/services/auth';
import { Buy, BuyDetail } from '../../../core/interfaces/buy';
import { Product } from '../../../core/interfaces/product';
import { Supplier } from '../../../core/interfaces/supplier';
import { User } from '../../../core/interfaces/user';
import { Alert } from '../../../shared/components/alert/alert';

@Component({
  selector: 'app-buys-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Alert],
  templateUrl: './buys-form.html',
  styleUrls: ['./buys-form.scss']
})
export class BuysForm implements OnInit {
  buyForm!: FormGroup;
  products: Product[] = [];
  suppliers: Supplier[] = [];
  users: User[] = [];
  isEditMode = false;
  isViewMode = false;
  buyId?: number;
  buy?: Buy;
  currentUserId?: number;
  currentUserName: string = '';

  showAlert: boolean = false;
  confirmAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';
  pendingBuyData: Buy | null = null;

  pendingDetailIndex: number | null = null; 
  pendingCancelAction: boolean = false; 


  constructor(
    private fb: FormBuilder,
    private buysService: BuysService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private userService: UserService,
    private authService: Auth,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();

    const buy = this.route.snapshot.data['buy'] as Buy | null;

    if (buy) {
      this.isEditMode = true;
      this.buyId = buy.identifier;
      this.buy = buy;

      // Cargar datos primero, luego cargar la compra
      this.loadData(() => 
        this.loadBuyData(buy));
        
    } else {
      // Nueva compra
      this.loadData(() => {
        this.loadCurrentUser();
        this.addDetail();
      });
    }
  }

  /**
   * Carga el usuario actual desde el AuthService
   */
  loadCurrentUser() {
    const userFromToken = this.authService.getUserFromToken();

    if (!userFromToken?.name) {
      this.alertService.show('No se pudo obtener el usuario actual', 'error');
      this.router.navigate(['/login']);
      return;
    }

    // Buscar el usuario por nombre
    this.userService.findByName(userFromToken.name).subscribe({
      next: (user) => {
        this.currentUserId = user.identifier;
        this.currentUserName = user.name;

        // Asignar automáticamente al formulario y deshabilitar
        this.buyForm.patchValue({
          user_identifier: user.identifier
        });

        // Deshabilitar el campo de usuario
        this.buyForm.get('user_identifier')?.disable();
      },
      error: (err) => {
        console.error('Error al cargar usuario actual:', err);
        this.alertService.show('Error al cargar el usuario actual', 'error');
      }
    });
  }

  initForm() {
    this.buyForm = this.fb.group({
      user_identifier: ['', [Validators.required, Validators.min(1)]],
      supplier_identifier: ['', [Validators.required, Validators.min(1)]],
      payment_method: ['', Validators.required],
      details: this.fb.array([])
    });
  }

  get details(): FormArray {
    return this.buyForm.get('details') as FormArray;
  }

  createDetail(): FormGroup {
    return this.fb.group({
      product_identifier: ['', Validators.required],
      amount: [1, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0.01)]],
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

  loadData(callback?: () => void) {
    let completedRequests = 0;
    const totalRequests = 3;

    const checkCompletion = () => {
      completedRequests++;
      if (completedRequests === totalRequests && callback) {
        callback();
      }
    };

    this.productService.findAll().subscribe({
      next: (data) => {
        this.products = data.filter(p => p.state === 'A');
        checkCompletion();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.alertService.show('Error al cargar productos', 'error');
        checkCompletion();
      }
    });

    this.supplierService.findAll().subscribe({
      next: (data) => {
        this.suppliers = data.filter(s => s.state === 'A');
        checkCompletion();
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        this.alertService.show('Error al cargar proveedores', 'error');
        checkCompletion();
      }
    });

    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        checkCompletion();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.alertService.show('Error al cargar usuarios', 'error');
        checkCompletion();
      }
    });
  }

  loadBuyData(buy: Buy) {
    // Cargar datos principales del formulario
    this.buyForm.patchValue({
      user_identifier: buy.user_identifier,
      supplier_identifier: buy.supplier_identifier,
      payment_method: buy.payment_method
    });

    // Deshabilitar el campo de usuario en modo edición
    this.buyForm.get('user_identifier')?.disable();

    // Limpiar y cargar detalles
    this.details.clear();

    if (buy.details && buy.details.length > 0) {
      buy.details.forEach(detail => {
        const detailGroup = this.createDetail();
        detailGroup.patchValue({
          product_identifier: detail.product_identifier,
          amount: detail.amount,
          unitCost: detail.unitCost,
          subtotal: detail.subtotal || (detail.amount * detail.unitCost)
        });
        this.details.push(detailGroup);
      });
    } else {
      // Si no hay detalles, agregar uno vacío
      this.addDetail();
    }

    // Recalcular el total
    this.calculateTotal();
  }

  calculateSubtotal(index: number) {
    const detail = this.details.at(index);
    const amount = detail.get('amount')?.value || 0;
    const unitCost = detail.get('unitCost')?.value || 0;
    const subtotal = amount * unitCost;

    detail.patchValue({ subtotal });
    this.calculateTotal();
  }

  calculateTotal(): number {
    let total = 0;
    this.details.controls.forEach(detail => {
      total += detail.get('subtotal')?.value || 0;
    });
    return total;
  }

  onProductChange(i: number) {
    this.calculateSubtotal(i);
  }

  onAmountChange(i: number) {
    this.calculateSubtotal(i);
  }

  onCostChange(i: number) {
    this.calculateSubtotal(i);
  }

  getStatusLabel(): string {
    if (!this.buy?.status) return '';
    return this.buy.status === 'R' ? 'Recibido' : 'Cancelado';
  }

  getStatusClass(): string {
    if (!this.buy?.status) return '';
    return this.buy.status === 'R' ? 'badge-registered' : 'badge-cancelled';
  }

  onSubmit() {
    if (this.buyForm.invalid || this.details.length === 0) {
      this.setAlert('Complete todos los campos requeridos', 'warning');
      this.buyForm.markAllAsTouched();
      return;
    }

    const message = this.isEditMode
      ? '¿Está seguro de actualizar esta compra?'
      : '¿Está seguro de registrar esta compra?';

    this.alertMessage = message;
    this.alertType = 'info';
    this.confirmAlert = true;
    this.showAlert = true;

    this.pendingBuyData = this.prepareBuyData();
  }

  private prepareBuyData(): Buy {
    const formValue = this.buyForm.getRawValue();
    return {
      ...formValue,
      identifier: this.buyId,
      user_identifier: Number(formValue.user_identifier),
      supplier_identifier: Number(formValue.supplier_identifier),
      details: formValue.details.map((d: any) => ({
        product_identifier: Number(d.product_identifier),
        amount: Number(d.amount),
        unitCost: Number(d.unitCost)
      }))
    };
  }
  handleAlertConfirm(confirmed: boolean) {
    this.showAlert = false;
    this.confirmAlert = false;

    if (this.pendingDetailIndex !== null) {
      if (confirmed) {
        this.details.removeAt(this.pendingDetailIndex);
        this.calculateTotal();
        this.setAlert('Producto eliminado', 'success');
      }
      this.pendingDetailIndex = null;
      return;
    }

    if (this.pendingCancelAction) {
      if (confirmed) {
        this.router.navigate(['/buys']);
      }
      this.pendingCancelAction = false;
      return;
    }

    if (!confirmed || !this.pendingBuyData) return;

    const request = this.isEditMode
      ? this.buysService.update(this.pendingBuyData)
      : this.buysService.save(this.pendingBuyData);

    request.subscribe({
      next: () => {
        const mensaje = this.isEditMode
          ? 'Compra actualizada correctamente'
          : 'Compra registrada correctamente';
        this.setAlert(mensaje, 'success');
        setTimeout(() => this.router.navigate(['/buys']), 1500);
      },
      error: (err) => {
        console.error('Error al guardar la compra:', err);
        this.setAlert('Error al guardar la compra', 'error');
      }
    });

    this.pendingBuyData = null;
  }

  setAlert(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 3000);
  }

  cancel() {
    if (this.buyForm.dirty) {
      this.pendingCancelAction = true;
      this.alertMessage = '¿Está seguro de cancelar? Los cambios no guardados se perderán.';
      this.alertType = 'warning';
      this.confirmAlert = true;
      this.showAlert = true;
    } else {
      this.router.navigate(['/buys']);
    }
  }
}