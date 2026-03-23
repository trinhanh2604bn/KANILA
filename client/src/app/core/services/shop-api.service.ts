import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShopApiService {
  // Thay 5000 bằng cổng (port) mà server Node.js của bạn đang chạy
  private apiUrl = 'http://localhost:5000/api/products'; 

  constructor(private http: HttpClient) { }

  // Hàm gọi API lấy danh sách sản phẩm kèm bộ lọc
  getProducts(filters: any): Observable<any> {
    let params = new HttpParams();

    // 1. Lọc theo giá
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice);
    
    // 2. Sắp xếp & Trạng thái Sale
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.isSale) params = params.set('isSale', 'true');

    // 3. Lọc theo ID Thương hiệu (gửi chuỗi các ID cách nhau dấu phẩy)
    if (filters.brandIds && filters.brandIds.length > 0) {
      params = params.set('brandId', filters.brandIds.join(','));
    }

    // 4. Lọc theo ID Danh mục
    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }

    // 5. Lọc theo Loại da (Tags)
    if (filters.skinTypes && filters.skinTypes.length > 0) {
      params = params.set('tags', filters.skinTypes.join(','));
    }

    // Gửi request GET tới Backend
    return this.http.get(this.apiUrl, { params });
  }
}