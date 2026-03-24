import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

export interface ProductAttributeRow {
  _id: string;
  productId: string | { _id?: string };
  attributeName: string;
  attributeValue: string;
}

@Injectable({ providedIn: 'root' })
export class ProductAttributeService {
  private readonly apiUrl = 'http://localhost:5000/api/product-attributes';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ProductAttributeRow[]> {
    return this.http
      .get<ApiResponse<ProductAttributeRow[]>>(this.apiUrl)
      .pipe(map((res) => res.data ?? []));
  }
}
