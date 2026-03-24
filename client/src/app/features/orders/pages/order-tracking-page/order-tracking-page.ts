import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';
import { OrderTrackingView } from '../../models/order.model';

@Component({
  selector: 'app-order-tracking-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-tracking-page.html',
  styleUrls: ['./order-tracking-page.css'],
})
export class OrderTrackingPageComponent implements OnInit {
  tracking: OrderTrackingView | null = null;
  isLoading = true;
  hasError = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id') || '';
    if (!orderId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }
    this.orderService.getMyOrderTracking(orderId).pipe(take(1)).subscribe((data) => {
      this.tracking = data;
      this.isLoading = false;
      this.hasError = !data;
    });
  }
}
