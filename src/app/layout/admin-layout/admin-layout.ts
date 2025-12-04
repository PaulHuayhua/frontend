import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Sidebar } from './components/sidebar/sidebar';
import { Alert } from '../../shared/components/alert/alert';
import { AlertService } from '../../core/services/alert.service';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    Header,
    Sidebar,
    Alert,
    AsyncPipe
  ],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss']
})
export class AdminLayout {
  sidebarExpanded = true;

  visible$!: Observable<boolean>;
  message$!: Observable<string>;
  type$!: Observable<'success' | 'error' | 'info' | 'warning'>;

  constructor(private alertService: AlertService) {
    this.visible$ = this.alertService.visible$.pipe(map(v => !!v));
    this.message$ = this.alertService.message$.pipe(map(m => m ?? ''));
    this.type$ = this.alertService.type$.pipe(map(t => t ?? 'info'));
  }

  onToggleSidebar(expanded: boolean) {
    this.sidebarExpanded = expanded;
  }

  closeAlert() {
    this.alertService.close();
  }
}
