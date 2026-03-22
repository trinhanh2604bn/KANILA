import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardSparklineComponent } from '../dashboard-sparkline/dashboard-sparkline.component';

@Component({
  selector: 'app-dashboard-kpi-card',
  standalone: true,
  imports: [CommonModule, DashboardSparklineComponent],
  templateUrl: './dashboard-kpi-card.component.html',
  styleUrl: './dashboard-kpi-card.component.css',
})
export class DashboardKpiCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  icon = input.required<string>();
  variant = input<'primary' | 'default'>('default');
  /** Trend vs prior period; ignored when showTrend is false. */
  trend = input<number | null>(null);
  showTrend = input(true);
  context = input('');
  sparklineValues = input<number[] | null>(null);
  sparklineAccent = input<string>('var(--dash-spark-muted, #94a3b8)');

  hasSparkline = computed(() => {
    const s = this.sparklineValues();
    return Array.isArray(s) && s.length > 0;
  });

  hasNumericTrend = computed(() => {
    const t = this.trend();
    return t !== null && t !== undefined && Number.isFinite(t);
  });

  trendState = computed<'up' | 'down' | 'flat'>(() => {
    const t = this.trend();
    if (t === null || t === undefined || !Number.isFinite(t)) return 'flat';
    if (t > 0) return 'up';
    if (t < 0) return 'down';
    return 'flat';
  });

  trendDisplay = computed(() => {
    const t = this.trend();
    if (t === null || t === undefined || !Number.isFinite(t)) return '—';
    const sign = t > 0 ? '+' : '';
    return `${sign}${Math.round(t * 10) / 10}%`;
  });
}
