import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { HeaderBrandItem } from '../models/header.model';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

interface RawBrand {
  _id: string;
  brandName: string;
  brandCode?: string;
  logoUrl?: string;
  brandStatus?: 'active' | 'inactive' | 'draft';
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly apiUrl = 'http://localhost:5000/api/brands';
  private headerBrands$?: Observable<HeaderBrandItem[]>;

  constructor(private readonly http: HttpClient) {}

  getHeaderBrands(): Observable<HeaderBrandItem[]> {
    if (!this.headerBrands$) {
      this.headerBrands$ = this.http.get<ApiResponse<RawBrand[]>>(this.apiUrl).pipe(
        map((res) =>
          (res.data ?? [])
            .filter((b) => (b.isActive ?? b.brandStatus !== 'inactive') && b.brandStatus !== 'inactive')
            .sort((a, b) => a.brandName.localeCompare(b.brandName))
            .map((b) => ({
              id: b._id,
              name: b.brandName,
              code: b.brandCode ?? '',
              slug: this.slugify(b.brandName || b.brandCode || b._id),
              logoUrl: b.logoUrl || '',
            }))
        ),
        shareReplay(1)
      );
    }
    return this.headerBrands$;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
