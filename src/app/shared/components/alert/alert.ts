import { Component, Input, Output, EventEmitter } from '@angular/core'; // Se agregan los imports faltantes
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-alert',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './alert.html',
  styleUrls: ['./alert.scss'] // Corregido: era 'styleUrl', debe ser 'styleUrls'
})
export class Alert {
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' | 'warning' = 'info';
  @Input() visible = false;
  @Input() confirm = false;

  @Output() close = new EventEmitter<void>();
  @Output() confirmResult = new EventEmitter<boolean>();

  onClose(): void {
    this.close.emit();
  }

  onConfirm(response: boolean): void {
    this.confirmResult.emit(response);
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