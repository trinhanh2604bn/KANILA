import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { BrandListItem } from '../../core/models/brand.model';
import { BrandService } from '../../core/services/brand.service';

@Component({
  selector: 'app-brands',
  imports: [CommonModule, RouterLink],
  templateUrl: './brands.html',
  styleUrl: './brands.css',
})
export class Brands implements OnInit {
  // Bảng chữ cái để làm thanh điều hướng nhanh
  alphabets: string[] = ['0-9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  
  // Biến chứa dữ liệu sau khi đã nhóm theo chữ cái
  groupedBrands: { letter: string, brands: BrandListItem[] }[] = [];
  totalBrands: number = 0;

  rawBrands: BrandListItem[] = [];

  constructor(private readonly brandService: BrandService) {}

  ngOnInit() {
    this.brandService
      .getBrands()
      .pipe(catchError(() => of([] as BrandListItem[])))
      .subscribe((brands) => {
        this.rawBrands = brands;
        this.totalBrands = this.rawBrands.length;
        this.groupBrandsByLetter();
      });
  }

  // Hàm tự động phân nhóm thương hiệu theo chữ cái đầu
  groupBrandsByLetter() {
    const groups: { [key: string]: BrandListItem[] } = {};

    this.rawBrands.forEach(brand => {
      let firstChar = brand.name.charAt(0).toUpperCase();
      
      // Nếu chữ cái đầu là số, gộp chung vào nhóm '0-9'
      if (/[0-9]/.test(firstChar)) {
        firstChar = '0-9';
      }

      if (!groups[firstChar]) {
        groups[firstChar] = [];
      }
      groups[firstChar].push(brand);
    });

    // Chuyển Object thành Array và sắp xếp theo bảng chữ cái
    this.groupedBrands = Object.keys(groups).map(key => ({
      letter: key,
      brands: groups[key].sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.letter.localeCompare(b.letter));
  }

  // Hàm cuộn mượt mà tới phần chữ cái tương ứng khi click trên thanh alphabet
  scrollToLetter(letter: string) {
    const element = document.getElementById('letter-' + letter);
    if (element) {
      // Trừ đi khoảng cách header để không bị lẹm chữ
      const headerOffset = 120; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  // Hàm xử lý khi ảnh logo bị lỗi (do chưa có file thật), hiển thị ảnh placeholder
  onImageError(event: any, brandName: string) {
    event.target.src = `https://ui-avatars.com/api/?name=${brandName}&background=f9f9f9&color=6b1e2e&size=200&font-size=0.3`;
  }
}
