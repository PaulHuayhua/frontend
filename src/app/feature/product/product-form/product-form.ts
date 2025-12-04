import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/interfaces/product';
import { Alert } from '../../../shared/components/alert/alert';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatIconModule,
    Alert
  ],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.scss']
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  form!: FormGroup;
  isEditMode = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'warning' = 'success';
  confirmAlert = false;
  pendingProductData: Product | null = null;

  ngOnInit(): void {
    this.buildForm();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      const id = Number(idParam);
      this.productService.findById(id).subscribe({
        next: (product: Product) => this.form.patchValue(product),
        error: () => this.showErrorAlert('No se pudo cargar el producto.')
      });
    }
  }

  buildForm(): void {
    const decimalPattern = /^\d+(\.\d{1,2})?$/;
    this.form = this.fb.group({
      identifier: [{ value: null, disabled: true }],
      code: [''],
      name: ['', [Validators.required, Validators.maxLength(70), this.noMultipleSpacesValidator()]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(160), this.noMultipleSpacesValidator()]],
      volumeWeight: [null, [Validators.required, Validators.min(0.01)]],
      unitMeasure: ['', Validators.required],
      stock: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      price: [0.01, [Validators.required, Validators.min(0.01), Validators.max(10000), Validators.pattern(decimalPattern)]],
      expirationDate: [null, [this.futureDateValidator(30, 1825), this.noSundayValidator()]],
      category: ['', Validators.required],
      registrationDate: [{ value: new Date(), disabled: true }]
    });
  }

  // --- VALIDADORES PERSONALIZADOS ---
  noMultipleSpacesValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
      typeof control.value === 'string' && /\s{2,}/.test(control.value)
        ? { multipleSpaces: true }
        : null;
  }

  futureDateValidator(minDays: number, maxDays: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const minDate = new Date(today); minDate.setDate(today.getDate() + minDays);
      const maxDate = new Date(today); maxDate.setDate(today.getDate() + maxDays);
      const inputDate = new Date(control.value);
      if (inputDate < minDate) return { futureDate: true };
      if (inputDate > maxDate) return { tooFarDate: true };
      return null;
    };
  }

  noSundayValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return new Date(control.value).getDay() === 0 ? { noSunday: true } : null;
    };
  }

  // --- ACCIONES DEL FORMULARIO ---
  onSubmit(): void {
    if (this.form.invalid) return;
    const product: Product = { ...this.form.getRawValue() };

    if (this.isEditMode) {
      this.alertMessage = '¿Seguro que deseas actualizar este producto?';
      this.alertType = 'warning';
      this.confirmAlert = true;
      this.showAlert = true;
      this.pendingProductData = product;
    } else {
      this.saveProduct(product);
    }
  }

  // ✅ CORREGIDO: ahora maneja Confirmar / Cancelar correctamente
  handleAlertConfirm(confirmed: boolean): void {
    if (confirmed && this.pendingProductData) {
      this.saveProduct(this.pendingProductData);
    } else {
      this.showAlert = false; // Cierra el alerta si se cancela
    }
    this.pendingProductData = null;
  }

  // ✅ CORREGIDO: navegación absoluta y sin delay innecesario
  saveProduct(product: Product): void {
    const request$ = this.isEditMode
      ? this.productService.update(product.identifier!, product)
      : this.productService.save(product);

    request$.subscribe({
      next: () => {
        this.alertMessage = `Producto ${this.isEditMode ? 'actualizado' : 'registrado'} correctamente.`;
        this.alertType = 'success';
        this.confirmAlert = false;
        this.showAlert = true;

        // Pequeño delay visual para mostrar el mensaje (1s)
        setTimeout(() => {
          this.showAlert = false;
          this.router.navigate(['/products']); // ✅ Siempre vuelve al listado
        }, 1000);
      },
      error: (error) => {
        const msg = error?.error?.message || '';
        if (msg.includes('uq_product_complete')) {
          this.showErrorAlert('Ya existe un producto con el mismo nombre y categoría.');
        } else {
          this.showErrorAlert('Error al guardar el producto.');
        }
      }
    });
  }

  showErrorAlert(message: string): void {
    this.alertMessage = message;
    this.alertType = 'error';
    this.confirmAlert = false;
    this.showAlert = true;
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}