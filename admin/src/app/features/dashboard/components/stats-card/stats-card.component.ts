import { Component, input } from '@angular/core';

export interface StatCard {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  color: 'primary' | 'success' | 'warning' | 'info';
}

@Component({
  selector: 'app-stats-card',
  standalone: true,
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.css',
})
export class StatsCardComponent {
  stat = input.required<StatCard>();
}
