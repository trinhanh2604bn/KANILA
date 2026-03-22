import { Component, computed, input } from '@angular/core';

/** Small area/line sparkline for KPI cards (normalized to viewBox). */
@Component({
  selector: 'app-dashboard-sparkline',
  standalone: true,
  template: `
    <svg class="spark" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient [attr.id]="gradId()" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="accent()" stop-opacity="0.28" />
          <stop offset="100%" [attr.stop-color]="accent()" stop-opacity="0" />
        </linearGradient>
      </defs>
      @if (sparkLinePath(); as lp) {
        <path [attr.d]="sparkAreaPath()!" [attr.fill]="'url(#' + gradId() + ')'" />
        <path
          [attr.d]="lp"
          fill="none"
          [attr.stroke]="accent()"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 40px;
    }
    .spark {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
})
export class DashboardSparklineComponent {
  values = input<number[]>([]);
  accent = input<string>('var(--dash-spark-muted, #94a3b8)');

  private uid = Math.random().toString(36).slice(2, 9);
  gradId = computed(() => `spark-grad-${this.uid}`);

  sparkLinePath = computed(() => {
    const v = this.values();
    if (!v.length) return null;
    const clean = v.map((n) => (Number.isFinite(n) ? n : 0));
    const max = Math.max(...clean);
    const min = Math.min(...clean);
    const range = Math.max(max - min, 1e-9);
    const w = 120;
    const h = 32;
    const pad = 2;
    const n = clean.length;
    const step = n > 1 ? (w - pad * 2) / (n - 1) : 0;
    const pts = clean.map((val, i) => {
      const x = pad + i * step;
      const y = pad + h - ((val - min) / range) * (h - pad * 2);
      return { x, y };
    });
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x},${pts[i].y}`;
    }
    return d;
  });

  sparkAreaPath = computed(() => {
    const lp = this.sparkLinePath();
    if (!lp) return null;
    return `${lp} L 118,34 L 2,34 Z`;
  });
}
