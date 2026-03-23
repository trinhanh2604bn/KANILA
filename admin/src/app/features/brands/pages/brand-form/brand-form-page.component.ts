import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BrandsApiService } from '../../services/brands-api.service';
import { environment } from '../../../../core/config/environment';

@Component({
  selector: 'app-brand-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './brand-form-page.component.html',
  styleUrl: './brand-form-page.component.css',
})
export class BrandFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BrandsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiOrigin = environment.apiUrl.replace(/\/api\/?$/, '');

  isEdit = signal(false);
  loading = signal(true);
  saving = signal(false);
  brandId = '';

  /** Read-only fields when editing (not part of the form payload). */
  editMeta = signal<{ productCount: number; createdAt: string } | null>(null);

  /** Hide logo preview after failed load until URL changes. */
  logoPreviewErrored = signal(false);

  form = this.fb.nonNullable.group({
    brandName: ['', [Validators.required]],
    brandCode: ['', [Validators.required]],
    description: [''],
    logoUrl: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    this.brandId = this.route.snapshot.params['id'];
    if (this.brandId) {
      this.isEdit.set(true);
      this.api.getById(this.brandId).subscribe({
        next: (brand) => {
          this.form.patchValue({
            brandName: brand.brandName,
            brandCode: brand.brandCode,
            description: brand.description,
            logoUrl: brand.logoUrl ?? '',
            isActive: brand.isActive,
          });
          this.editMeta.set({
            productCount: brand.productCount ?? 0,
            createdAt: brand.createdAt ?? '',
          });
          this.logoPreviewErrored.set(false);
          this.loading.set(false);
        },
        error: () => this.router.navigate(['/brands'])
      });
    } else {
      this.loading.set(false);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = this.form.getRawValue();
    
    const obs = this.isEdit() 
      ? this.api.update(this.brandId, payload)
      : this.api.create(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/brands']);
      },
      error: () => this.saving.set(false)
    });
  }

  onLogoUrlInput(): void {
    this.logoPreviewErrored.set(false);
  }

  resolveLogoUrl(url: string | null | undefined): string {
    const u = (url ?? '').trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/')) return `${this.apiOrigin}${u}`;
    return u;
  }

  formatCreatedAt(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }
}
