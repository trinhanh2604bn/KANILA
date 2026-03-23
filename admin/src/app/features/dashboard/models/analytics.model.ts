export interface MetricSummary {
  label: string;
  /** Display value; use "—" when unknown. */
  value: string;
  /** Percent change vs prior period; null when unknown. */
  trend: number | null;
  /** Comparison copy for trend rows, or snapshot label for static metrics. */
  context: string;
  showTrend?: boolean;
  /** Normalized series for mini sparkline (same length as date range). */
  sparkline?: number[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardTopProduct {
  id: string;
  title: string;
  sales: number;
}

export interface DashboardLowStockItem {
  id: string;
  title: string;
  stock: number;
}

export interface AnalyticsDashboardData {
  primaryMetric: MetricSummary;
  secondaryMetrics: MetricSummary[];
  salesChart: ChartDataPoint[];
  topProducts: DashboardTopProduct[];
  lowStockItems: DashboardLowStockItem[];
}
