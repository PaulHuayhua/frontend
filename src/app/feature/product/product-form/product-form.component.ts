import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';

import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/interfaces/product';

import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    AlertComponent
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
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

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.isEditMode = true;
        const id = Number(idParam);
        this.productService.findById(id).subscribe({
          next: (product: Product) => {
            this.form.patchValue(product);
            this.form.get('identifier')?.setValue(product.identifier);
          },
          error: () => {
            this.showErrorAlert('No se pudo cargar el producto.');
            this.router.navigate(['/product-list']);
          }
        });
      }
    });
  }

  buildForm(): void {
    this.form = this.fb.group({
      identifier: [{ value: null, disabled: true }],
      name: ['', [Validators.required, Validators.maxLength(70)]],
      description: ['', [Validators.required, Validators.maxLength(160)]],
      size: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      expiration_date: [''],
      category: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const product: Product = {
      ...this.form.getRawValue()
    };

    if (this.isEditMode) {
      this.alertMessage = '¿Seguro que quieres modificar este producto?';
      this.alertType = 'warning';
      this.confirmAlert = true;
      this.showAlert = true;
      this.pendingProductData = product;
    } else {
      this.saveProduct(product);
    }
  }

  handleAlertConfirm(confirmed: boolean): void {
    if (!confirmed || !this.pendingProductData) {
      this.pendingProductData = null;
      return;
    }

    this.saveProduct(this.pendingProductData);
    this.pendingProductData = null;
  }

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
        setTimeout(() => this.router.navigate(['/product-list']), 2000);
      },
      error: (error) => {
        const msg = error?.error?.message || error?.error || '';
        if (msg.includes('uq_name_size_category')) {
          this.showErrorAlert('Ya existe un producto con el mismo nombre, categoría y tamaño.');
        } else {
          this.showErrorAlert(`No se pudo ${this.isEditMode ? 'actualizar' : 'registrar'} el producto.`);
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
    this.router.navigate(['/product-list']);
  }
}
