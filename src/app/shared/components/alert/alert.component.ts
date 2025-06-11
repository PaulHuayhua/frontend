import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Input() message: string = '';
  @Input() autoClose: boolean = true;
  @Output() closed = new EventEmitter<void>();

  visible = true;

  ngOnInit() {
    if (this.autoClose) {
      setTimeout(() => this.closeAlert(), 3000);
    }
  }

  closeAlert() {
    this.visible = false;
    this.closed.emit();
  }
}
