import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface RecommendedProductView {
  productId: string;
  score: number;
  reasons: string[];
  reason_codes?: string[];
  badges: string[];
  score_breakdown?: Record<string, number>;
  algorithm_version?: string;
  product: {
    _id: string;
    productName: string;
    name?: string;
    slug: string;
    imageUrl: string;
    image?: string;
    price: number;
    averageRating: number;
    rating?: number;
    bought: number;
    brandName: string;
    brand?: string;
  };
}

export interface RecommendationOverviewAnalytics {
  total_impressions: number;
  unique_customers_recommended_to: number;
  total_recommended_products_served: number;
  top_contexts: Array<{ _id: string; count: number }>;
  algorithm_versions: string[];
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly api = 'http://localhost:5000/api/recommendations';

  constructor(private readonly http: HttpClient) {}

  getMyRecommendations(category = '', limit = 12, context = ''): Observable<RecommendedProductView[]> {
    const qs = new URLSearchParams();
    if (category) qs.set('category', category);
    qs.set('limit', String(limit));
    if (context) qs.set('context', context);
    return this.http.get<any>(`${this.api}/me?${qs.toString()}`).pipe(
      map((res) => (res?.data || []) as RecommendedProductView[]),
      catchError(() => of([]))
    );
  }

  previewRecommendations(payload: {
    skin_types: string[];
    skin_tone: string;
    eye_color: string;
    concerns: string[];
    ingredient_preferences: string[];
    favorite_brands: string[];
  }, category = '', context = 'preview'): Observable<RecommendedProductView[]> {
    const qs = new URLSearchParams();
    if (category) qs.set('category', category);
    if (context) qs.set('context', context);
    return this.http.post<any>(`${this.api}/preview?${qs.toString()}`, payload).pipe(
      map((res) => (res?.data || []) as RecommendedProductView[]),
      catchError(() => of([]))
    );
  }

  getAnalyticsOverview(): Observable<RecommendationOverviewAnalytics | null> {
    return this.http.get<any>('http://localhost:5000/api/admin/recommendations/analytics/overview').pipe(
      map((res) => (res?.data || null) as RecommendationOverviewAnalytics | null),
      catchError(() => of(null))
    );
  }
}
