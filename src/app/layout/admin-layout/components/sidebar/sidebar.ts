import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class Sidebar {
  expanded = true;

  @Output() toggleSidebar = new EventEmitter<boolean>();

  toggle() {
    this.expanded = !this.expanded;
    this.toggleSidebar.emit(this.expanded);
  }
}