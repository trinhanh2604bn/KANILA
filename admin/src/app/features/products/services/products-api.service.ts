import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { Product, CreateProductPayload, UpdateProductPayload } from '../models/product.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const URL = `${environment.apiUrl}/products`;

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiOrigin = environment.apiUrl.replace(/\/api\/?$/, '');

  /** Absolute URL for product images (CDN, http(s), or site-relative paths). */
  resolveImageUrl(url: string | null | undefined): string {
    const u = (url ?? '').trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/')) return `${this.apiOrigin}${u}`;
    return u;
  }

  getAll(): Observable<Product[]> {
    return this.http.get<ApiResponse<any[]>>(URL).pipe(map((res) => res.data.map((p) => this.mapProduct(p))));
  }

  getById(id: string): Observable<Product> {
    return this.http.get<ApiResponse<any>>(`${URL}/${id}`).pipe(map((res) => this.mapProduct(res.data)));
  }

  create(data: CreateProductPayload & Record<string, unknown>): Observable<Product> {
    return this.http
      .post<ApiResponse<any>>(URL, this.toApiBody(data))
      .pipe(map((res) => this.mapProduct(res.data)));
  }

  update(id: string, data: UpdateProductPayload & Record<string, unknown>): Observable<Product> {
    return this.http
      .put<ApiResponse<any>>(`${URL}/${id}`, this.toApiBody(data))
      .pipe(map((res) => this.mapProduct(res.data)));
  }

  delete(id: string): Observable<Product> {
    return this.http.delete<ApiResponse<any>>(`${URL}/${id}`).pipe(map((res) => this.mapProduct(res.data)));
  }

  toggleStatus(id: string): Observable<Product> {
    return this.http.get<ApiResponse<any>>(`${URL}/${id}`).pipe(
      switchMap((res) => {
        const p = res.data;
        const currentlyActive = p.isActive !== false;
        return this.update(id, { isActive: !currentlyActive });
      })
    );
  }

  /**
   * Strips UI-only fields and maps `status` (published/draft) → `isActive`.
   * First gallery image becomes `imageUrl` when set.
   */
  private toApiBody(data: Record<string, unknown>): Record<string, unknown> {
    const {
      status,
      images,
      options: _options,
      variants: _variants,
      id: _id,
      brandName: _bn,
      categoryName: _cn,
      createdAt: _ca,
      updatedAt: _ua,
      createdByEmail: _cbe,
      updatedByEmail: _ube,
      ...rest
    } = data;

    const imageList = Array.isArray(images) ? (images as string[]).filter(Boolean) : [];
    const existingUrl = typeof rest['imageUrl'] === 'string' ? (rest['imageUrl'] as string).trim() : '';
    const imageUrl = existingUrl || imageList[0] || '';

    let isActive: boolean;
    if (status === 'published') isActive = true;
    else if (status === 'draft') isActive = false;
    else if (typeof rest['isActive'] === 'boolean') isActive = rest['isActive'] as boolean;
    else isActive = true;

    const body: Record<string, unknown> = { ...rest, isActive, imageUrl };
    delete body['status'];
    delete body['images'];
    return body;
  }

  /**
   * Map backend populated product to frontend Product interface.
   * Backend populates brandId → { _id, brandName, brandCode }
   * Backend populates categoryId → { _id, categoryName, categoryCode }
   */
  private mapProduct(raw: any): Product {
    const isActive = raw.isActive !== false;
    const productStatus: 'active' | 'inactive' =
      raw.productStatus === 'inactive' || (!isActive && raw.productStatus !== 'active')
        ? 'inactive'
        : 'active';

    const b = raw.brandId;
    const c = raw.categoryId;

    const brandPopulated =
      b &&
      typeof b === 'object' &&
      !Array.isArray(b) &&
      (b.brandName !== undefined || b.brandCode !== undefined || b._id !== undefined);
    const catPopulated =
      c &&
      typeof c === 'object' &&
      !Array.isArray(c) &&
      (c.categoryName !== undefined || c.categoryCode !== undefined || c._id !== undefined);

    const brandObj = brandPopulated ? b : null;
    const catObj = catPopulated ? c : null;

    const refId = (ref: any): string => {
      if (ref == null || ref === '') return '';
      if (typeof ref === 'object' && ref._id != null) return String(ref._id);
      return String(ref);
    };

    const createdBy = raw.createdByAccountId;
    const updatedBy = raw.updatedByAccountId;
    const emailFrom = (pop: any): string | undefined => {
      if (pop && typeof pop === 'object' && typeof pop.email === 'string') return pop.email;
      return undefined;
    };

    const imageUrl = raw.imageUrl || raw.image_url || '';
    const imageList = Array.isArray(raw.images) ? raw.images.filter(Boolean) : [];
    const images = imageList.length > 0 ? imageList : imageUrl ? [imageUrl] : [];

    return {
      id: String(raw._id ?? raw.id ?? ''),
      productName: raw.product_name || raw.productName || raw.name || '',
      productCode: raw.product_code || raw.productCode || '',
      slug: raw.slug ?? '',
      brandId: refId(brandObj ?? b),
      brandName: brandObj?.brandName || raw.brandName || '',
      categoryId: refId(catObj ?? c),
      categoryName: catObj?.categoryName || raw.categoryName || '',
      price: raw.price ?? raw.basePrice ?? raw.base_price ?? 0,
      imageUrl,
      images,
      shortDescription: raw.short_description || raw.shortDescription || '',
      longDescription: raw.long_description || raw.longDescription || '',
      ingredientText: raw.ingredientText ?? raw.ingredient_text ?? '',
      usageInstruction: raw.usageInstruction ?? raw.usage_instruction ?? '',
      stock: raw.stock ?? 0,
      bought: raw.bought ?? 0,
      averageRating: raw.averageRating ?? raw.average_rating ?? 0,
      isActive,
      productStatus,
      status: isActive ? 'published' : 'draft',
      createdAt: raw.created_at || raw.createdAt || '',
      updatedAt: raw.updated_at || raw.updatedAt || '',
      createdByEmail: emailFrom(createdBy),
      updatedByEmail: emailFrom(updatedBy),
    };
  }
}
