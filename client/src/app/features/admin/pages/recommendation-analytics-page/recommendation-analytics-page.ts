import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { RecommendationAnalyticsRow, RecommendationOverviewAnalytics, RecommendationService } from '../../../../core/services/recommendation.service';

@Component({
  selector: 'app-recommendation-analytics-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recommendation-analytics-page.html',
  styleUrl: './recommendation-analytics-page.css',
})
export class RecommendationAnalyticsPageComponent implements OnInit {
  loading = true;
  error = '';
  overview: RecommendationOverviewAnalytics | null = null;
  topReasons: RecommendationAnalyticsRow[] = [];
  topProducts: RecommendationAnalyticsRow[] = [];
  topBrands: RecommendationAnalyticsRow[] = [];
  byContext: RecommendationAnalyticsRow[] = [];
  timeline: Array<{ date: string; count: number }> = [];

  constructor(private readonly recommendationService: RecommendationService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      overview: this.recommendationService.getAnalyticsOverview(),
      topReasons: this.recommendationService.getAnalyticsTopReasons(),
      topProducts: this.recommendationService.getAnalyticsTopProducts(),
      topBrands: this.recommendationService.getAnalyticsTopBrands(),
      byContext: this.recommendationService.getAnalyticsByContext(),
      timeline: this.recommendationService.getAnalyticsTimeline(),
    }).subscribe({
      next: (res) => {
        this.overview = res.overview;
        this.topReasons = res.topReasons.slice(0, 10);
        this.topProducts = res.topProducts.slice(0, 10);
        this.topBrands = res.topBrands.slice(0, 10);
        this.byContext = res.byContext;
        this.timeline = res.timeline.slice(-14);
        this.loading = false;
      },
      error: () => {
        this.error = 'Không thể tải analytics recommendations.';
        this.loading = false;
      },
    });
  }

  get hasData(): boolean {
    return !!this.overview || this.topReasons.length > 0 || this.topProducts.length > 0 || this.topBrands.length > 0 || this.timeline.length > 0;
  }

  maxTimelineCount(): number {
    return Math.max(1, ...this.timeline.map((x) => x.count || 0));
  }

  getProductRowName(row: RecommendationAnalyticsRow): string {
    return String(row['product_name'] || row['product_id'] || '');
  }

  getBrandRowName(row: RecommendationAnalyticsRow): string {
    return String(row['brand_name'] || row['brand_id'] || '');
  }
}
