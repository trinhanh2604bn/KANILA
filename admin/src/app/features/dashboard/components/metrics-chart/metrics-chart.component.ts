import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartDataPoint } from '../../models/analytics.model';

const CHART_WIDTH = 800;
const CHART_HEIGHT = 220;
const AREA_FLOOR_Y = 240;

@Component({
  selector: 'app-metrics-chart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './metrics-chart.component.html',
  styleUrl: './metrics-chart.component.css',
})
export class MetricsChartComponent {
  @Input() data: ChartDataPoint[] = [];
  /** When true, show a chart-area skeleton (e.g. refetch). */
  @Input() loading = false;
  hoverIndex = -1;

  points = computed(() => {
    if (!this.data.length) return [];

    const maxVal = Math.max(...this.data.map((d) => d.value), 1);
    const n = this.data.length;
    const spacing = n > 1 ? CHART_WIDTH / (n - 1) : 0;

    return this.data.map((d, i) => {
      const x = n === 1 ? CHART_WIDTH / 2 : i * spacing;
      const y = CHART_HEIGHT - (d.value / maxVal) * CHART_HEIGHT;
      return { x, y, label: d.label, value: d.value };
    });
  });

  pathData = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const curr = pts[i];
      const prev = pts[i - 1];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    return d;
  });

  areaPathData = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    const d = this.pathData();
    return `${d} L ${pts[pts.length - 1].x},${AREA_FLOOR_Y} L 0,${AREA_FLOOR_Y} Z`;
  });

  tooltipLeft(): string {
    if (this.hoverIndex < 0 || this.points().length === 0) return '50%';
    if (this.points().length <= 1) return '50%';
    const pct = (this.hoverIndex / (this.points().length - 1)) * 100;
    return `${pct}%`;
  }

  tooltipTop(): number {
    const pts = this.points();
    if (this.hoverIndex < 0 || !pts[this.hoverIndex]) return 0;
    return pts[this.hoverIndex].y - 48;
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
  }
}
