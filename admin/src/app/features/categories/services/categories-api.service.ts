import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../models/category.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const URL = `${environment.apiUrl}/categories`;

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Category[]> {
    return this.http.get<ApiResponse<any[]>>(URL).pipe(
      map(res => res.data.map(c => this.mapCategory(c)))
    );
  }

  getById(id: string): Observable<Category> {
    return this.http.get<ApiResponse<any>>(`${URL}/${id}`).pipe(
      map(res => this.mapCategory(res.data))
    );
  }

  create(data: CreateCategoryPayload): Observable<Category> {
    return this.http.post<ApiResponse<any>>(URL, data).pipe(
      map(res => this.mapCategory(res.data))
    );
  }

  update(id: string, data: UpdateCategoryPayload): Observable<Category> {
    return this.http.put<ApiResponse<any>>(`${URL}/${id}`, data).pipe(
      map(res => this.mapCategory(res.data))
    );
  }

  delete(id: string): Observable<Category> {
    return this.http.delete<ApiResponse<any>>(`${URL}/${id}`).pipe(
      map(res => this.mapCategory(res.data))
    );
  }

  private mapCategory(raw: any): Category {
    const status = raw.category_status || '';
    const isActive = status === 'active' || status === 'ACTIVE' || raw.isActive === true;

    return {
      id: String(raw._id ?? raw.id ?? ''),
      categoryName: raw.category_name || raw.categoryName || raw.name || '',
      categoryCode: raw.category_code || raw.categoryCode || '',
      description: raw.description || '',
      parentCategoryId: this.normalizeParentId(raw),
      displayOrder: raw.display_order ?? raw.displayOrder ?? 0,
      isActive: isActive,
      createdAt: raw.created_at || raw.createdAt || '',
    };
  }

  /** API may return ObjectId, string, or populated { _id, ... } — tree needs a string id or null. */
  private normalizeParentId(raw: any): string | null {
    const p = raw.parent_category_id ?? raw.parentCategoryId;
    if (p == null || p === '') return null;
    if (typeof p === 'object' && p._id != null) return String(p._id);
    return String(p);
  }
}
