import { Component, OnInit } from '@angular/core';

import { ProductCardComponent } from '../product-card/product-card';
import { ProductService } from '../../../../../core/services/product.service';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../../core/models/product.model';




@Component({
  selector: 'app-product-list',
  imports: [ProductCardComponent, CommonModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  products: Product[] = [];
  allProducts: Product[] = [];
  selectedBrands: string[] = [];



  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getHomeDiscoverPool(100).subscribe((data) => {
      this.allProducts = data;
      this.products = this.randomizeProducts(this.allProducts);
    });
  }

  randomizeProducts(products: Product[]): Product[] {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 60);
  }

  // Hàm gọi khi người dùng chọn checkbox
  onFilterChange(selectedFilters: string[]) {
    // Random lại sản phẩm mỗi khi thao tác
    this.products = this.randomizeProducts(this.allProducts);
    window.scrollTo(0, 0);
  }

}