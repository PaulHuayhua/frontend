import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Alert } from '../../../shared/components/alert/alert'; // 👈 IMPORTA TU ALERT
import { AlertService } from '../../../core/services/alert.service'; // 👈 IMPORTA EL SERVICIO

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule, Alert], // 👈 AGREGA app-alert AQUÍ
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.scss']
})
export class LoginPage implements OnInit {

  loginForm!: FormGroup;

  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(Auth);
  alertService = inject(AlertService); // 👈 AGREGA EL SERVICIO

  ngOnInit(): void {
    this.initLoginForm();
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.alertService.show("Nombre de usuario o contraseña incorrectos", 'error', 6000);
      }
    });
  }

  initLoginForm(): void {
    this.loginForm = this.fb.group({
      name: ['', Validators.required],
      passwordHash: ['', Validators.required]
    });
  }

}
