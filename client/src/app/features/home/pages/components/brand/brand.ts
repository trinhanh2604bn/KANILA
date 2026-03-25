import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { BrandService } from '../../../../../core/services/brand.service';
import { HeaderBrandItem } from '../../../../../core/models/header.model';

@Component({
  selector: 'app-brand',
  imports: [CommonModule, RouterLink],
  templateUrl: './brand.html',
  styleUrl: './brand.css',
})
export class Brand implements OnInit {
  brands: HeaderBrandItem[] = [];
  loading = true;

  constructor(private readonly brandService: BrandService) {}

  ngOnInit(): void {
    this.brandService
      .getHeaderBrands()
      .pipe(catchError(() => of([] as HeaderBrandItem[])))
      .subscribe((list: HeaderBrandItem[]) => {
        this.brands = list.slice(0, 14);
        this.loading = false;
      });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (!target) return;
    target.src = `https://ui-avatars.com/api/?name=Brand&background=f9f9f9&color=6b1e2e&size=200&font-size=0.3`;
  }

}
