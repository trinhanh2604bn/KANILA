import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProductsApiService } from '../../services/products-api.service';
import { CategoriesApiService } from '../../../categories/services/categories-api.service';
import { BrandsApiService } from '../../../brands/services/brands-api.service';
import { Product } from '../../models/product.model';
import { Category } from '../../../categories/models/category.model';
import { Brand } from '../../../brands/models/brand.model';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogService } from '../../../../core/services/dialog.service';

@Component({
  selector: 'app-product-list-page',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './product-list-page.component.html',
  styleUrl: './product-list-page.component.css',
})
export class ProductListPageComponent implements OnInit {
  private readonly api = inject(ProductsApiService);
  private readonly catApi = inject(CategoriesApiService);
  private readonly brandApi = inject(BrandsApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  loading = signal(true);
  togglingId = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  categoryFilter = signal('');
  brandFilter = signal('');
  statusFilter = signal('');

  // API-ready list state
  page = signal(1);
  pageSize = signal(10);
  sortBy = signal<keyof Product>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Bulk actions state
  selectedIds = signal<Set<string>>(new Set());

  /** Hide broken remote images after onerror. */
  failedThumbIds = signal<Set<string>>(new Set());

  filteredAndSorted = computed(() => {
    let list = this.products();
    
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(p => p.productName.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q));
    if (this.categoryFilter()) list = list.filter(p => p.categoryId === this.categoryFilter());
    if (this.brandFilter()) list = list.filter(p => p.brandId === this.brandFilter());
    if (this.statusFilter()) list = list.filter(p => p.status === this.statusFilter());
    
    const field = this.sortBy();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    list = list.sort((a, b) => {
      const valA = a[field] ?? '';
      const valB = b[field] ?? '';
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
    
    return list;
  });

  paginatedList = computed(() => {
    const list = this.filteredAndSorted();
    const start = (this.page() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  totalItems = computed(() => this.filteredAndSorted().length);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  hasActiveFilters = computed(() => !!this.searchQuery() || !!this.categoryFilter() || !!this.brandFilter() || !!this.statusFilter());

  isAllSelected = computed(() => {
    const visible = this.paginatedList();
    return visible.length > 0 && visible.every(p => this.selectedIds().has(p.id));
  });

  ngOnInit(): void {
    forkJoin({
      products: this.api.getAll(),
      categories: this.catApi.getAll(),
      brands: this.brandApi.getAll(),
    }).subscribe({
      next: ({ products, categories, brands }) => {
        const catById = new Map(categories.map((c) => [String(c.id), c.categoryName]));
        const brandById = new Map(brands.map((b) => [String(b.id), b.brandName]));
        const enriched = products.map((p) => ({
          ...p,
          categoryName: (p.categoryName && p.categoryName.trim()) || catById.get(String(p.categoryId)) || '—',
          brandName: (p.brandName && p.brandName.trim()) || brandById.get(String(p.brandId)) || '—',
        }));
        this.categories.set(categories);
        this.brands.set(brands);
        this.products.set(enriched);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** First available image URL for table thumb (resolved for relative paths). */
  primaryImageUrl(p: Product): string {
    const raw = (p.images && p.images.length > 0 ? p.images[0] : null) || p.imageUrl || '';
    return this.api.resolveImageUrl(raw);
  }

  onThumbError(productId: string): void {
    this.failedThumbIds.update((s) => new Set(s).add(productId));
  }

  clearFilters(): void { 
    this.searchQuery.set(''); this.categoryFilter.set(''); this.brandFilter.set(''); this.statusFilter.set(''); 
    this.page.set(1);
  }

  // --- Sorting & Pagination ---
  toggleSort(field: keyof Product): void {
    if (this.sortBy() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDirection.set('asc');
    }
  }

  changePage(delta: number): void {
    const newPage = this.page() + delta;
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.page.set(newPage);
      this.selectedIds.set(new Set()); // Clear selection on page change
    }
  }

  // --- Selection & Bulk Actions ---
  toggleSelectAll(): void {
    const visible = this.paginatedList();
    const current = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      visible.forEach(p => current.delete(p.id));
    } else {
      visible.forEach(p => current.add(p.id));
    }
    this.selectedIds.set(current);
  }

  toggleSelectRow(id: string): void {
    const current = new Set(this.selectedIds());
    if (current.has(id)) current.delete(id);
    else current.add(id);
    this.selectedIds.set(current);
  }

  async bulkDelete() {
    const count = this.selectedIds().size;
    const ids = Array.from(this.selectedIds());
    const confirmed = await this.dialog.confirm({
      title: 'Delete Products',
      message: `Are you sure you want to delete ${count} selected product(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      isDestructive: true
    });

    if (!confirmed) return;

    forkJoin(ids.map((id) => this.api.delete(id))).subscribe({
      next: () => {
        this.products.update((list) => list.filter((p) => !ids.includes(p.id)));
        this.selectedIds.set(new Set());
        this.toast.success(`Deleted ${count} product(s) successfully.`);
      },
      error: () => {
        this.toast.error('Could not delete one or more products. Try again.');
      },
    });
  }

  bulkUpdateStatus(status: 'draft' | 'published') {
    const count = this.selectedIds().size;
    const ids = Array.from(this.selectedIds());
    const isActive = status === 'published';
    forkJoin(ids.map((id) => this.api.update(id, { isActive }))).subscribe({
      next: (updated) => {
        const byId = new Map(updated.map((u) => [u.id, u]));
        this.products.update((list) =>
          list.map((p) => {
            const u = byId.get(p.id);
            if (!u) return p;
            return { ...p, status: u.status, isActive: u.isActive, updatedAt: u.updatedAt };
          })
        );
        this.selectedIds.set(new Set());
        this.toast.success(`Updated ${count} product(s) to ${status}.`);
      },
      error: () => {
        this.toast.error('Could not update status for all products.');
      },
    });
  }

  // --- Single Actions ---
  toggleStatus(p: Product): void {
    this.togglingId.set(p.id);
    this.api.toggleStatus(p.id).subscribe({
      next: (u) => {
        this.products.update((list) =>
          list.map((x) =>
            x.id === u.id ? { ...x, status: u.status, isActive: u.isActive, updatedAt: u.updatedAt } : x
          )
        );
        this.togglingId.set(null);
        this.toast.info(`Product is now ${u.status === 'published' ? 'published' : 'draft'}.`);
      },
      error: () => {
        this.togglingId.set(null);
        this.toast.error('Could not update product status.');
      },
    });
  }

  // --- Formatters ---
  formatPrice(val: number): string { return (val ?? 0).toLocaleString('vi-VN') + '₫'; }

  getStockClass(stock: number): string {
    if (stock <= 5) return 'badge-danger';
    if (stock <= 20) return 'badge-warning';
    return 'badge-success';
  }
}
