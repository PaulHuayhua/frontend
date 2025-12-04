import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CommonModule, formatDate } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SupplierService } from '../../../core/services/supplier.service';
import { Supplier } from '../../../core/interfaces/supplier';
import { Router, RouterModule } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Alert } from '../../../shared/components/alert/alert';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    Alert
  ],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.scss'
})
export class SupplierForm implements OnInit {
  isEditMode = false;
  private supplierService = inject(SupplierService);

  @Input() supplier?: Supplier;
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  today = new Date();
  minDate = new Date();
  maxDate = new Date();

  showAlert: boolean = false;
  confirmAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';
  private existingSuppliers: Supplier[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      identifier: [''],
      code: [''],
      company: ['',
        [
          Validators.required,
          Validators.maxLength(100)
        ]],
      category: ['',
        [Validators.required,
        Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/),
        Validators.maxLength(50)
        ]],
      address: ['',
        [
          Validators.required,
          Validators.maxLength(150)
        ]],
      email_business: ['',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(255),
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        ]],
      cell_phone: ['',
        [
          Validators.required,
          Validators.pattern(/^9\d{8}$/)
        ]],
      ruc: ['',
        [
          Validators.required,
          Validators.pattern(/^\d{11}$/)
        ]],
      cooperation_date: [
        new Date(),
        [
          Validators.required
        ]],
      state: ['A']
    });
  }

  ngOnInit(): void {
    this.minDate.setMonth(this.today.getMonth() - 4);
    this.maxDate.setDate(this.today.getDate() + 14);

    this.supplierService.findAll().subscribe({
      next: (data) => {
        this.existingSuppliers = data;

        this.addUniqueValidators();
      }
    });

    this.supplierService.selectedSupplier$.subscribe(supplier => {
      if (supplier) {
        const parsedDate = this.convertStringToDate(supplier.cooperation_date?.toString() || '');
        const patchedSupplier = { ...supplier, cooperation_date: parsedDate };
        this.form.patchValue(patchedSupplier);
        this.isEditMode = true;
      }
    });
  }

  addUniqueValidators(): void {
    const currentId = this.form.get('identifier')?.value;

    this.form.get('company')?.addValidators([
      control => {
        const value = control.value;
        const isDuplicate = this.existingSuppliers.some(
          s => s.company === value && s.identifier !== currentId
        );
        return isDuplicate ? { uniqueCompany: true } : null;
      }
    ]);

    this.form.get('email_business')?.addValidators([
      control => {
        const value = control.value;
        const isDuplicate = this.existingSuppliers.some(
          s => s.email_business === value && s.identifier !== currentId
        );
        return isDuplicate ? { uniqueEmail: true } : null;
      }
    ]);

    this.form.get('ruc')?.addValidators([
      control => {
        const value = control.value;
        const isDuplicate = this.existingSuppliers.some(
          s => s.ruc === value && s.identifier !== currentId
        );
        return isDuplicate ? { uniqueRuc: true } : null;
      }
    ]);

    this.form.get('company')?.updateValueAndValidity();
    this.form.get('email_business')?.updateValueAndValidity();
    this.form.get('ruc')?.updateValueAndValidity();
  }



  convertStringToDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const dateParts = dateStr.split('-');
    if (dateParts.length !== 3) return null;
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    return new Date(year, month, day);
  }

  onlyNumbers(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    if (!pattern.test(event.key)) {
      event.preventDefault();
    }
  }

  onlyLetters(event: KeyboardEvent) {
    const pattern = /[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/;
    if (!pattern.test(event.key)) {
      event.preventDefault();
    }
  }

  onSubmit(): void {
  if (this.form.invalid) return;

  const formValue = this.form.value;
  const formattedDate = formatDate(formValue.cooperation_date, 'yyyy-MM-dd', 'en-US');
  const supplierData: Supplier = { ...formValue, cooperation_date: formattedDate };

  // Mostrar confirmación antes de guardar o actualizar
  this.alertMessage = this.isEditMode
    ? '¿Deseas actualizar este proveedor?'
    : '¿Deseas registrar este proveedor?';

  this.alertType = 'info';
  this.confirmAlert = true;
  this.showAlert = true;

  // Guardamos temporalmente los datos
  this.pendingSupplierData = supplierData;
}


  pendingSupplierData: Supplier | null = null;

handleAlertConfirm(confirmed: boolean) {
  this.showAlert = false;
  this.confirmAlert = false;

  if (!confirmed || !this.pendingSupplierData) return;

  const supplierData = this.pendingSupplierData;

  const request$ = this.isEditMode
    ? this.supplierService.update(supplierData)
    : this.supplierService.save(supplierData);

  request$.subscribe({
    next: () => {
      const mensaje = this.isEditMode
        ? 'Proveedor actualizado correctamente'
        : 'Proveedor registrado correctamente';

      this.setAlert(mensaje, 'success');
      setTimeout(() => this.onCancel(), 1500);
    },
    error: (err) => {
      console.error('Error al guardar/actualizar:', err);
      this.setAlert('Error al guardar el proveedor', 'error');
    }
  });

  this.pendingSupplierData = null;
}


  setAlert(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 3000);
  }

  onCancel(): void {
    this.router.navigate(['suppliers']);
  }
}