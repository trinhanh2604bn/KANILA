import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface RecommendedProductView {
  productId: string;
  score: number;
  reasons: string[];
  badges: string[];
  product: {
    _id: string;
    productName: string;
    slug: string;
    imageUrl: string;
    price: number;
    averageRating: number;
    bought: number;
    brandName: string;
  };
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly api = 'http://localhost:5000/api/recommendations';

  constructor(private readonly http: HttpClient) {}

  getMyRecommendations(category = '', limit = 12): Observable<RecommendedProductView[]> {
    const qs = new URLSearchParams();
    if (category) qs.set('category', category);
    qs.set('limit', String(limit));
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
  }): Observable<RecommendedProductView[]> {
    return this.http.post<any>(`${this.api}/preview`, payload).pipe(
      map((res) => (res?.data || []) as RecommendedProductView[]),
      catchError(() => of([]))
    );
  }
}
