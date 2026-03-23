import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsApiService } from '../../services/analytics-api.service';
import { AnalyticsDashboardData, MetricSummary } from '../../models/analytics.model';
import { MetricsChartComponent } from '../../components/metrics-chart/metrics-chart.component';
import { DashboardKpiCardComponent } from '../../components/dashboard-kpi-card/dashboard-kpi-card.component';
import { DashboardSectionCardComponent } from '../../components/dashboard-section-card/dashboard-section-card.component';
import { DashboardPageSkeletonComponent } from '../../components/dashboard-page-skeleton/dashboard-page-skeleton.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MetricsChartComponent,
    DashboardKpiCardComponent,
    DashboardSectionCardComponent,
    DashboardPageSkeletonComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit {
  private api = inject(AnalyticsApiService);

  timeRange = signal<'7d' | '30d' | '90d'>('30d');
  data = signal<AnalyticsDashboardData | null>(null);
  loading = signal(true);

  readonly primarySparkAccent = 'var(--primary, #b8557a)';
  readonly secondarySparkAccent = 'var(--dash-spark-muted, #cbd5e1)';

  ngOnInit() {
    this.fetchData();
  }

  setTimeRange(range: '7d' | '30d' | '90d') {
    if (this.timeRange() === range) return;
    this.timeRange.set(range);
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);
    this.api.getDashboardData(this.timeRange()).subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  rangeLabel(): string {
    const r = this.timeRange();
    if (r === '7d') return 'Last 7 days';
    if (r === '90d') return 'Last 90 days';
    return 'Last 30 days';
  }

  rangeSubcopy(): string {
    return `Metrics for ${this.rangeLabel().toLowerCase()}, compared to the previous window of the same length.`;
  }

  iconFor(metric: MetricSummary): string {
    const map: Record<string, string> = {
      Revenue: 'payments',
      Orders: 'shopping_bag',
      Products: 'inventory_2',
      Customers: 'groups',
      'Low stock': 'package_2',
    };
    return map[metric.label] ?? 'insights';
  }

  displayProductTitle(title: string | undefined): string {
    const t = title?.trim();
    return t ? t : '—';
  }
}
