import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './alert.html',
  styleUrls: ['./alert.scss']
})
export class Alert implements OnInit {

  // Inputs para usar en templates
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' | 'warning' = 'info';
  @Input() visible = false;
  @Input() confirm = false;

  // Eventos opcionales
  @Output() close = new EventEmitter<void>();
  @Output() confirmResult = new EventEmitter<boolean>();

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    // El componente se actualiza automáticamente desde el servicio
    this.alertService.message$.subscribe(msg => this.message = msg);
    this.alertService.type$.subscribe(t => this.type = t);
    this.alertService.visible$.subscribe(v => this.visible = v);
  }

  onClose(): void {
    this.alertService.close();
    this.close.emit();
  }

  onConfirm(value: boolean): void {
    this.alertService.close();
    this.confirmResult.emit(value);
  }

  getIcon(): string {
    switch (this.type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'info': return 'info';
      case 'warning': return 'warning';
      default: return 'notification_important';
    }
  }

  getTitle(): string {
    switch (this.type) {
      case 'success': return 'Éxito';
      case 'error': return 'Error';
      case 'info': return 'Información';
      case 'warning': return 'Advertencia';
      default: return 'Alerta';
    }
  }
}
