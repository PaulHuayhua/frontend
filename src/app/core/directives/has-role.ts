import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, inject } from '@angular/core';
import { Auth } from '../services/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  @Input() hasRole!: string | string[]; // Roles permitidos

  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(Auth);
  private http = inject(HttpClient);

  ngOnInit(): void {
    const token = this.authService.getToken();
    
    // Si no hay token → ocultar
    if (!token) {
      this.viewContainer.clear();
      return;
    }

    // Intentar obtener el rol desde localStorage primero (más rápido)
    const cachedRole = this.authService.getUserRole();
    
    if (cachedRole) {
      // Si ya tenemos el rol en cache, usarlo directamente
      this.checkRole(cachedRole);
    } else {
      // Si no hay rol en cache, obtenerlo del backend
      this.http.get<{ role: string }>(`${environment.urlBackEnd}/v1/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (user) => {
          // Guardar en localStorage para próximas veces
          localStorage.setItem('userRole', user.role);
          this.checkRole(user.role);
        },
        error: () => {
          this.viewContainer.clear(); // Error → ocultar elemento
        }
      });
    }
  }

  private checkRole(userRole: string): void {
    // Convertir input a array si es string
    const allowedRoles = typeof this.hasRole === 'string' ? [this.hasRole] : this.hasRole;
    
    if (allowedRoles.includes(userRole)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}