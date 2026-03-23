import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {

  private apiUrl = 'http://localhost:5000/api/products'; 

  constructor(private http: HttpClient) {}
  getProducts(): Observable<Product[]> {
    return this.http
      .get<{ success?: boolean; data?: Product[] }>(this.apiUrl)
      .pipe(map((res) => res.data ?? []));
  }

  getProductBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/slug/${slug}`);
  }
}