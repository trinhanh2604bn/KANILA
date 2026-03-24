import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecommendedProductView } from '../../../../core/services/recommendation.service';

@Component({
  selector: 'app-recommendation-product-block',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recommendation-product-block.html',
  styleUrl: './recommendation-product-block.css',
})
export class RecommendationProductBlockComponent {
  @Input() title = 'Gợi ý phù hợp với bạn';
  @Input() subtitle = '';
  @Input() items: RecommendedProductView[] = [];
  @Input() loading = false;
  @Input() error = '';
  @Input() emptyText = 'Chưa có gợi ý phù hợp.';
  @Input() ctaText = '';
  @Output() retry = new EventEmitter<void>();
}
