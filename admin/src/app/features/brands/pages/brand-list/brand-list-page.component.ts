import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandsApiService } from '../../services/brands-api.service';
import { Brand } from '../../models/brand.model';
import { environment } from '../../../../core/config/environment';

@Component({
  selector: 'app-brand-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './brand-list-page.component.html',
  styleUrl: './brand-list-page.component.css',
})
export class BrandListPageComponent implements OnInit {
  private readonly api = inject(BrandsApiService);
  private readonly apiOrigin = environment.apiUrl.replace(/\/api\/?$/, '');

  brands = signal<Brand[]>([]);
  loading = signal(true);
  /** Brand ids whose logo image failed to load (show placeholder). */
  failedLogoIds = signal<Set<string>>(new Set());

  searchQuery = signal('');
  filteredBrands = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.brands();
    return this.brands().filter(b => 
      b.brandName.toLowerCase().includes(q) || 
      (b.brandCode && b.brandCode.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.api.getAll().subscribe(brands => {
      this.brands.set(brands);
      this.loading.set(false);
    });
  }

  /** Absolute URL for <img src> (supports http(s) and site-relative paths). */
  logoSrc(brand: Brand): string {
    const url = brand.logoUrl?.trim() ?? '';
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return `${this.apiOrigin}${url}`;
    return url;
  }

  showLogo(brand: Brand): boolean {
    return !!this.logoSrc(brand) && !this.failedLogoIds().has(brand.id);
  }

  onLogoError(brandId: string): void {
    this.failedLogoIds.update((s: Set<string>) => new Set(s).add(brandId));
  }
}
