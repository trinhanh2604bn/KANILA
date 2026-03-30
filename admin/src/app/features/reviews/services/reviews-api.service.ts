import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Review } from '../models/review.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const URL = `${environment.apiUrl}/reviews`;
const MEDIA_URL = `${environment.apiUrl}/review-media`;
const ADMIN_URL = `${environment.apiUrl}/admin/reviews`;

@Injectable({ providedIn: 'root' })
export class ReviewsApiService {
  private readonly http = inject(HttpClient);

  getReviews(): Observable<Review[]> {
    return this.http.get<ApiResponse<any[]>>(URL).pipe(
      map(res => res.data.map(r => this.mapReview(r)))
    );
  }

  getReviewById(id: string): Observable<Review> {
    const safeId = encodeURIComponent(String(id));
    return this.http.get<ApiResponse<any>>(`${URL}/${safeId}`).pipe(
      map((res) => this.mapReview(res.data))
    );
  }

  /** Optional images attached via ReviewMedia collection. */
  getMediaForReview(reviewId: string): Observable<string[]> {
    const safeId = encodeURIComponent(String(reviewId));
    return this.http.get<ApiResponse<any[]>>(`${MEDIA_URL}/review/${safeId}`).pipe(
      map((res) =>
        (res.data ?? []).map((m: any) => m.mediaUrl || m.media_url || '').filter(Boolean)
      )
    );
  }

  /** Admin approve — sets approvedByAccountId, approvedAt, recalcs review summary. */
  approveReview(id: string, adminNote?: string): Observable<Review> {
    const safeId = encodeURIComponent(String(id));
    return this.http.patch<ApiResponse<any>>(`${ADMIN_URL}/${safeId}/approve`, { adminNote: adminNote || '' }).pipe(
      map((res) => this.mapReview(res.data))
    );
  }

  /** Admin reject — clears approval fields, recalcs review summary. */
  rejectReview(id: string, adminNote?: string): Observable<Review> {
    const safeId = encodeURIComponent(String(id));
    return this.http.patch<ApiResponse<any>>(`${ADMIN_URL}/${safeId}/reject`, { adminNote: adminNote || '' }).pipe(
      map((res) => this.mapReview(res.data))
    );
  }

  private mapReview(raw: any): Review {
    const pid = raw.productId;
    const productId =
      typeof pid === 'object' && pid !== null && '_id' in pid
        ? String(pid._id)
        : String(pid ?? '');

    const t = (raw.reviewTitle || raw.review_title || raw.title || '').trim();
    const b = (raw.reviewContent || raw.review_content || raw.body || '').trim();
    const title = t && b ? t : undefined;
    const content = b || t || '';

    const cust = raw.customer_id ?? raw.customerId;
    let customerName = 'Anonymous';
    if (typeof cust === 'object' && cust !== null) {
      customerName =
        cust.full_name ||
        cust.fullName ||
        [cust.first_name, cust.last_name].filter(Boolean).join(' ').trim() ||
        [cust.firstName, cust.lastName].filter(Boolean).join(' ').trim() ||
        cust.customer_code ||
        cust.customerCode ||
        customerName;
    }

    const productName =
      (typeof pid === 'object' && pid?.productName) || raw.productName || '';

    return {
      id: String(raw._id ?? raw.id ?? ''),
      productId,
      productName: productName || 'Unknown product',
      title,
      customerName,
      rating: Number(raw.rating) || 0,
      content,
      status: (raw.reviewStatus || raw.review_status || 'pending') as Review['status'],
      images: Array.isArray(raw.images) ? raw.images : [],
      createdAt: raw.createdAt || raw.created_at || '',
    };
  }
}
