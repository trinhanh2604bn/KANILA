import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AnalyticsDashboardData } from '../models/analytics.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

interface DashboardSummary {
  range: string;
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalAccounts: number;
  totalRevenue: number;
  revenueTrend: number;
  periodOrders: number;
  ordersTrend: number;
  lowStockProducts: number;
  salesChart: { label: string; value: number }[];
  topProducts: { id: string; title: string; sales: number }[];
  lowStockItems: { id: string; title: string; stock: number }[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  private readonly http = inject(HttpClient);

  getDashboardData(timeRange: '7d' | '30d' | '90d'): Observable<AnalyticsDashboardData> {
    const params = new HttpParams().set('range', timeRange);
    return this.http
      .get<ApiResponse<DashboardSummary>>(`${environment.apiUrl}/admin/dashboard-summary`, { params })
      .pipe(
        map((res) => {
          const d = res.data;
          const cmp = this.comparisonContext(d?.range);
          const chart = Array.isArray(d?.salesChart) ? d.salesChart : [];
          const len = Math.max(chart.length, 1);

          const revenueSeries = chart.map((p) => this.safeNumber(p?.value));
          const periodOrders = this.safeNumber(d?.periodOrders);
          const avgDailyOrders = periodOrders / len;
          const ordersSeries = chart.map(() => avgDailyOrders);

          const totalProducts = this.safeNumber(d?.totalProducts);
          const totalCustomers = this.safeNumber(d?.totalCustomers);
          const lowStock = this.safeNumber(d?.lowStockProducts);

          const flatProducts = chart.map(() => totalProducts);
          const flatCustomers = chart.map(() => totalCustomers);
          const flatLow = chart.map(() => lowStock);

          return {
            primaryMetric: {
              label: 'Revenue',
              value: this.formatCurrencySafe(d?.totalRevenue),
              trend: this.safeTrend(d?.revenueTrend),
              context: cmp,
              sparkline: revenueSeries.length ? revenueSeries : undefined,
            },
            secondaryMetrics: [
              {
                label: 'Orders',
                value: this.formatIntSafe(d?.periodOrders),
                trend: this.safeTrend(d?.ordersTrend),
                context: cmp,
                sparkline: chart.length ? ordersSeries : undefined,
              },
              {
                label: 'Products',
                value: this.formatIntSafe(d?.totalProducts),
                trend: null,
                context: 'Active catalog',
                showTrend: false,
                sparkline: chart.length ? flatProducts : undefined,
              },
              {
                label: 'Customers',
                value: this.formatIntSafe(d?.totalCustomers),
                trend: null,
                context: 'Registered',
                showTrend: false,
                sparkline: chart.length ? flatCustomers : undefined,
              },
              {
                label: 'Low stock',
                value: this.formatIntSafe(d?.lowStockProducts),
                trend: null,
                context: 'Units ≤ 10',
                showTrend: false,
                sparkline: chart.length ? flatLow : undefined,
              },
            ],
            salesChart: chart.map((p) => ({
              label: String(p?.label ?? '—'),
              value: this.safeNumber(p?.value),
            })),
            topProducts: Array.isArray(d?.topProducts)
              ? d.topProducts.map((p) => ({
                  id: String(p?.id ?? ''),
                  title: String(p?.title ?? '—'),
                  sales: this.safeNumber(p?.sales),
                }))
              : [],
            lowStockItems: Array.isArray(d?.lowStockItems)
              ? d.lowStockItems.map((p) => ({
                  id: String(p?.id ?? ''),
                  title: String(p?.title ?? '—'),
                  stock: this.safeNumber(p?.stock),
                }))
              : [],
          } satisfies AnalyticsDashboardData;
        })
      );
  }

  private safeNumber(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private safeTrend(v: unknown): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private formatCurrencySafe(v: unknown): string {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  }

  private formatIntSafe(v: unknown): string {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return String(Math.round(n));
  }

  private comparisonContext(range: string): string {
    const map: Record<string, string> = {
      '7d': 'vs previous 7 days',
      '30d': 'vs previous 30 days',
      '90d': 'vs previous 90 days',
    };
    return map[range] ?? 'vs previous period';
  }
}
