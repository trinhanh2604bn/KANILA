import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoriesApiService } from '../../services/categories-api.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-category-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './category-form-page.component.html',
  styleUrl: './category-form-page.component.css',
})
export class CategoryFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CategoriesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isEdit = signal(false);
  loading = signal(true);
  saving = signal(false);
  categoryId = '';
  
  categories = signal<Category[]>([]);

  form = this.fb.nonNullable.group({
    categoryName: ['', [Validators.required]],
    categoryCode: ['', [Validators.required]],
    description: [''],
    parentCategoryId: [null as string | null],
    displayOrder: [0, [Validators.min(0)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.params['id'];
    const prefilledParent = this.route.snapshot.queryParams['parent'];
    
    this.api.getAll().subscribe(cats => {
      this.categories.set(cats.filter(c => c.id !== this.categoryId)); // Prevent self-parenting
      this.loading.set(false);
    });

    if (prefilledParent) {
      this.form.patchValue({ parentCategoryId: prefilledParent });
    }

    if (this.categoryId) {
      this.isEdit.set(true);
      this.api.getById(this.categoryId).subscribe(cat => {
        this.form.patchValue({
          categoryName: cat.categoryName,
          categoryCode: cat.categoryCode,
          description: cat.description,
          parentCategoryId: cat.parentCategoryId,
          displayOrder: cat.displayOrder,
          isActive: cat.isActive,
        });
      });
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
      ? this.api.update(this.categoryId, payload)
      : this.api.create(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/categories']);
      },
      error: () => this.saving.set(false)
    });
  }
}
