import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Brand, CreateBrandPayload, UpdateBrandPayload } from '../models/brand.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const URL = `${environment.apiUrl}/brands`;

@Injectable({ providedIn: 'root' })
export class BrandsApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Brand[]> {
    return this.http.get<ApiResponse<any[]>>(URL).pipe(
      map(res => res.data.map(b => this.mapBrand(b)))
    );
  }

  getById(id: string): Observable<Brand> {
    return this.http.get<ApiResponse<any>>(`${URL}/${id}`).pipe(
      map(res => this.mapBrand(res.data))
    );
  }

  create(data: CreateBrandPayload): Observable<Brand> {
    return this.http.post<ApiResponse<any>>(URL, data).pipe(
      map(res => this.mapBrand(res.data))
    );
  }

  update(id: string, data: UpdateBrandPayload): Observable<Brand> {
    return this.http.put<ApiResponse<any>>(`${URL}/${id}`, data).pipe(
      map(res => this.mapBrand(res.data))
    );
  }

  delete(id: string): Observable<Brand> {
    return this.http.delete<ApiResponse<any>>(`${URL}/${id}`).pipe(
      map(res => this.mapBrand(res.data))
    );
  }

  /** Map backend _id to frontend id, fill missing UI fields */
  private mapBrand(raw: any): Brand {
    const status = raw.brand_status || '';
    const isActive = status === 'active' || status === 'ACTIVE' || raw.isActive === true;

    return {
      id: String(raw._id ?? raw.id ?? ''),
      brandName: raw.brand_name || raw.brandName || raw.name || '',
      brandCode: raw.brand_code || raw.brandCode || '',
      description: raw.description || '',
      logoUrl: raw.logo_url || raw.logoUrl || raw.logo || '',
      isActive: isActive,
      productCount: 0, // not returned by backend — placeholder
      createdAt: raw.created_at || raw.createdAt || '',
    };
  }
}
