import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { HeaderCategoryItem } from '../models/header.model';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

interface RawCategory {
  _id: string;
  categoryName: string;
  categoryCode?: string;
  displayOrder?: number;
  categoryStatus?: 'active' | 'inactive' | 'draft';
  isActive?: boolean;
  parentCategoryId?: string | { _id?: string } | null;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = 'http://localhost:5000/api/categories';
  private headerCategories$?: Observable<HeaderCategoryItem[]>;

  constructor(private readonly http: HttpClient) {}

  getHeaderCategories(): Observable<HeaderCategoryItem[]> {
    if (!this.headerCategories$) {
      this.headerCategories$ = this.http.get<ApiResponse<RawCategory[]>>(this.apiUrl).pipe(
        map((res) => this.toHeaderCategoryTree(res.data ?? [])),
        shareReplay(1)
      );
    }
    return this.headerCategories$;
  }

  private toHeaderCategoryTree(raw: RawCategory[]): HeaderCategoryItem[] {
    const activeRows = raw
      .filter((c) => (c.isActive ?? c.categoryStatus !== 'inactive') && c.categoryStatus !== 'inactive')
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    const byId = new Map<string, HeaderCategoryItem>();
    for (const c of activeRows) {
      byId.set(c._id, {
        id: c._id,
        name: c.categoryName,
        code: c.categoryCode ?? '',
        slug: this.slugify(c.categoryName || c.categoryCode || c._id),
        displayOrder: c.displayOrder ?? 0,
        children: [],
      });
    }

    const roots: HeaderCategoryItem[] = [];
    for (const c of activeRows) {
      const item = byId.get(c._id);
      if (!item) continue;
      const parentRef = c.parentCategoryId;
      const parentId = typeof parentRef === 'string' ? parentRef : parentRef?._id ?? '';
      if (parentId && byId.has(parentId)) byId.get(parentId)?.children.push(item);
      else roots.push(item);
    }

    const sortTree = (items: HeaderCategoryItem[]): HeaderCategoryItem[] => {
      items.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
      for (const i of items) sortTree(i.children);
      return items;
    };
    return sortTree(roots);
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
