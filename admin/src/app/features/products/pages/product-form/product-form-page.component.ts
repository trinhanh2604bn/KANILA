import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, switchMap } from 'rxjs';
import { ProductsApiService } from '../../services/products-api.service';
import { ProductVariantsApiService } from '../../services/product-variants-api.service';
import { CategoriesApiService } from '../../../categories/services/categories-api.service';
import { BrandsApiService } from '../../../brands/services/brands-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Category } from '../../../categories/models/category.model';
import { Brand } from '../../../brands/models/brand.model';
import { ProductOption, ProductVariant } from '../../models/variant.model';

const NUMERIC_VARIANT_FIELDS = new Set(['weightGrams', 'volumeMl', 'costAmount']);

@Component({
  selector: 'app-product-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './product-form-page.component.html',
  styleUrl: './product-form-page.component.css',
})
export class ProductFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ProductsApiService);
  private readonly variantApi = inject(ProductVariantsApiService);
  private readonly catApi = inject(CategoriesApiService);
  private readonly brandApi = inject(BrandsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  isEdit = signal(false);
  loading = signal(true);
  saving = signal(false);
  productId = '';
  activeSection = signal('section-basic');

  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  images = signal<string[]>([]);

  options = signal<ProductOption[]>([]);
  variants = signal<ProductVariant[]>([]);
  /** Snapshot from server for sync (create/update/delete). */
  serverVariants = signal<ProductVariant[]>([]);

  form = this.fb.nonNullable.group({
    productName: ['', [Validators.required]],
    productCode: ['', [Validators.required]],
    slug: [''],
    brandId: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    shortDescription: [''],
    longDescription: [''],
    ingredientText: [''],
    usageInstruction: [''],
    stock: [0, [Validators.required, Validators.min(0)]],
    status: ['draft' as 'published' | 'draft'],
  });

  ngOnInit(): void {
    this.productId = this.route.snapshot.params['id'];
    this.loadDependencies();

    if (this.productId) {
      this.isEdit.set(true);
      this.loadProduct();
    } else {
      this.loading.set(false);
    }
  }

  private loadDependencies(): void {
    this.catApi.getAll().subscribe((cats) => this.categories.set(cats));
    this.brandApi.getAll().subscribe((brands) => this.brands.set(brands));
  }

  private loadProduct(): void {
    forkJoin({
      product: this.api.getById(this.productId),
      variants: this.variantApi.getByProductId(this.productId),
    }).subscribe({
      next: ({ product, variants }) => {
        this.form.patchValue({
          productName: product.productName,
          productCode: product.productCode,
          slug: product.slug,
          brandId: product.brandId,
          categoryId: product.categoryId,
          price: product.price,
          shortDescription: product.shortDescription,
          longDescription: product.longDescription,
          ingredientText: product.ingredientText,
          usageInstruction: product.usageInstruction,
          stock: product.stock,
          status: product.status,
        });
        this.images.set(product.images || []);
        this.serverVariants.set(variants.map((v) => ({ ...v })));
        this.variants.set(variants.map((v) => ({ ...v })));
        const originals: Record<string, ProductVariant> = {};
        variants.forEach((v) => (originals[v.id] = { ...v }));
        this.originalVariants.set(originals);
        this.loading.set(false);
      },
      error: () => this.router.navigate(['/products']),
    });
  }

  scrollTo(sectionId: string): void {
    this.activeSection.set(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  // --- Media ---
  isDragging = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  onImageAdd(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []) as File[];
    this.handleFiles(files);
    input.value = '';
  }

  private handleFiles(files: File[]): void {
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const r = e.target?.result;
        if (typeof r === 'string') this.images.update((imgs) => [...imgs, r]);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.images.update((imgs) => imgs.filter((_, i) => i !== index));
  }

  moveImageUp(index: number): void {
    if (index === 0) return;
    this.images.update((imgs) => {
      const copy = [...imgs];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
  }

  moveImageDown(index: number): void {
    if (index === this.images().length - 1) return;
    this.images.update((imgs) => {
      const copy = [...imgs];
      [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]];
      return copy;
    });
  }

  // --- Options / variants matrix ---
  addOption(): void {
    this.options.update((opts) => [...opts, { name: '', values: [] }]);
  }

  removeOption(index: number): void {
    this.options.update((opts) => opts.filter((_, i) => i !== index));
    this.generateVariants();
  }

  addOptionValue(optIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.trim();
    if (val && !this.options()[optIndex].values.includes(val)) {
      this.options.update((opts) => {
        const newOpts = [...opts];
        newOpts[optIndex].values = [...newOpts[optIndex].values, val];
        return newOpts;
      });
      input.value = '';
      this.generateVariants();
    }
  }

  removeOptionValue(optIndex: number, valIndex: number): void {
    this.options.update((opts) => {
      const newOpts = [...opts];
      newOpts[optIndex].values = newOpts[optIndex].values.filter((_, i) => i !== valIndex);
      return newOpts;
    });
    this.generateVariants();
  }

  addVariantRow(): void {
    const base = (this.form.controls.productCode.value || 'SKU').trim();
    const id = `temp-${Date.now()}`;
    this.variants.update((vs) => [
      ...vs,
      {
        id,
        productId: this.productId || 'temp',
        sku: `${base}-NEW`.toUpperCase(),
        barcode: '',
        variantName: 'New variant',
        variantStatus: 'active',
        weightGrams: 0,
        volumeMl: 0,
        costAmount: 0,
      },
    ]);
    this.dirtyVariants.update((s) => new Set(s).add(id));
  }

  removeVariantRow(id: string): void {
    this.variants.update((vs) => vs.filter((v) => v.id !== id));
    this.originalVariants.update((o) => {
      const next = { ...o };
      delete next[id];
      return next;
    });
    this.editingCell.set(null);
  }

  generateVariants(): void {
    const activeOptions = this.options().filter((o) => o.name && o.values.length > 0);
    if (activeOptions.length === 0) {
      return;
    }

    const combinations = this.cartesianProduct(activeOptions.map((o) => o.values));
    const baseCode = (this.form.controls.productCode.value || 'SKU').trim();

    const newVariants: ProductVariant[] = combinations.map((combo, idx) => {
      const optionValues: Record<string, string> = {};
      activeOptions.forEach((opt, i) => {
        optionValues[opt.name] = combo[i];
      });
      const variantName = activeOptions.map((opt, i) => `${opt.name}: ${combo[i]}`).join(' · ');
      return {
        id: `temp-${idx}-${Date.now()}`,
        productId: this.productId || 'temp',
        sku: `${baseCode}-${combo.join('-')}`.toUpperCase().replace(/\s+/g, '-'),
        barcode: '',
        variantName,
        variantStatus: 'active' as const,
        weightGrams: 0,
        volumeMl: 0,
        costAmount: 0,
        optionValues,
      };
    });

    this.variants.set(newVariants);
    const originals: Record<string, ProductVariant> = {};
    newVariants.forEach((v) => (originals[v.id] = { ...v }));
    this.originalVariants.set(originals);
    this.dirtyVariants.set(new Set(newVariants.map((v) => v.id)));
  }

  private cartesianProduct(arrays: string[][]): string[][] {
    if (arrays.length === 0) return [];
    return arrays.reduce<string[][]>(
      (acc, b) => acc.flatMap((prefix) => b.map((val) => [...prefix, val])),
      [[]]
    );
  }

  // --- Inline edit ---
  editingCell = signal<{ id: string; field: string } | null>(null);
  originalVariants = signal<Record<string, ProductVariant>>({});
  dirtyVariants = signal<Set<string>>(new Set());
  savingVariant = signal<string | null>(null);

  startEdit(id: string, field: string, event?: Event): void {
    if (event) {
      setTimeout(() => {
        const input = (event.target as HTMLElement).closest('td')?.querySelector('input, select');
        if (input instanceof HTMLElement) input.focus();
      }, 0);
    }
    this.editingCell.set({ id, field });
  }

  onVariantKeydown(event: KeyboardEvent, variant: ProductVariant, field: string): void {
    if (event.key === 'Enter') {
      const target = event.target as HTMLInputElement;
      this.saveVariantCell(variant, field, target.value);
    } else if (event.key === 'Escape') {
      this.cancelVariantCell(variant, field);
    }
  }

  onVariantStatusChange(variant: ProductVariant, value: string): void {
    const status = value === 'inactive' ? 'inactive' : 'active';
    this.variants.update((vs) => vs.map((v) => (v.id === variant.id ? { ...v, variantStatus: status } : v)));
    this.dirtyVariants.update((set) => new Set(set).add(variant.id));
    this.editingCell.set(null);
  }

  saveVariantCell(variant: ProductVariant, field: string, value: string): void {
    this.editingCell.set(null);
    this.savingVariant.set(variant.id);

    let parsed: string | number = value;
    if (NUMERIC_VARIANT_FIELDS.has(field)) {
      const n = parseFloat(value);
      parsed = Number.isFinite(n) ? n : 0;
    } else if (field === 'sku') {
      parsed = value.trim().toUpperCase();
    } else {
      parsed = value.trim();
    }

    setTimeout(() => {
      this.variants.update((vs) =>
        vs.map((v) => (v.id === variant.id ? { ...v, [field]: parsed } : v))
      );
      this.dirtyVariants.update((set) => {
        const next = new Set(set);
        next.add(variant.id);
        return next;
      });
      this.savingVariant.set(null);
    }, 120);
  }

  cancelVariantCell(variant: ProductVariant, field: string): void {
    this.editingCell.set(null);
    const original = this.originalVariants()[variant.id];
    if (original) {
      const prev = (original as unknown as Record<string, unknown>)[field];
      this.variants.update((vs) =>
        vs.map((v) => (v.id === variant.id ? { ...v, [field]: prev } : v))
      );
    }
  }

  async bulkApplyCost(input: HTMLInputElement): Promise<void> {
    const val = input.value;
    const c = parseFloat(val);
    if (!Number.isFinite(c) || c < 0) return;
    const confirmed = await this.dialog.confirm({
      title: 'Bulk apply cost',
      message: `Apply ${c.toLocaleString('vi-VN')}₫ cost to all ${this.variants().length} variants?`,
      confirmText: 'Apply to all',
    });
    if (!confirmed) return;
    const prev = this.variants();
    this.variants.update((vs) => vs.map((v) => ({ ...v, costAmount: c })));
    this.toast.success(`Applied cost to ${this.variants().length} variants`, undefined, () => {
      this.variants.set(prev);
    });
    input.value = '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please check all required fields.');
      return;
    }

    const badVariants = this.variants().filter((v) => !v.sku?.trim() || !v.variantName?.trim());
    if (badVariants.length > 0) {
      this.toast.error('Each variant must have a display name and SKU.');
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      images: this.images(),
    };

    const afterSave = (productId: string) =>
      this.variantApi.syncForProduct(productId, this.variants(), this.serverVariants());

    const req = this.isEdit()
      ? this.api.update(this.productId, payload).pipe(switchMap(() => afterSave(this.productId)))
      : this.api.create(payload).pipe(switchMap((p) => afterSave(p.id)));

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.isEdit() ? 'Product updated successfully.' : 'Product created successfully.');
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Failed to save product. Please try again.';
        this.toast.error(typeof msg === 'string' ? msg : 'Failed to save product. Please try again.');
      },
    });
  }
}
