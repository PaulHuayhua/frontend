import { Component, OnInit } from '@angular/core';
import { Auth } from '../../../../core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header implements OnInit {
  userName: string = '';
  initials: string = '';

  constructor(private auth: Auth, private router: Router) {}

  ngOnInit(): void {
    // Obtener nombre desde token (si existe)
    const user = this.auth.getUserFromToken();
    if (user?.name) {
      this.userName = user.name;

      // Generar iniciales
      const parts = user.name.trim().split(' ');
      this.initials = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    } else {
      this.userName = 'Usuario Desconocido';
      this.initials = 'UD';
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
