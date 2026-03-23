import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-section-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-section-card.component.html',
  styleUrl: './dashboard-section-card.component.css',
})
export class DashboardSectionCardComponent {
  title = input.required<string>();
  subtitle = input<string>('');
  icon = input<string>('');
}
