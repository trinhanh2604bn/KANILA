import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';
import { OrderDetailView } from '../../models/order.model';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail-page.html',
  styleUrls: ['./order-detail-page.css'],
})
export class OrderDetailPageComponent implements OnInit {
  order: OrderDetailView | null = null;
  isLoading = true;
  hasError = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly orderService: OrderService
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id') || '';
    if (!orderId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }
    this.orderService.getMyOrderById(orderId).pipe(take(1)).subscribe((order) => {
      if (order) {
        this.order = order;
        this.isLoading = false;
        this.hasError = false;
        return;
      }
      this.orderService.getGuestOrderSummary(orderId).pipe(take(1)).subscribe((guestOrder) => {
        this.order = guestOrder;
        this.isLoading = false;
        this.hasError = !guestOrder;
      });
    });
  }

  goTracking(): void {
    if (!this.order?._id) return;
    this.router.navigate(['/orders', this.order._id, 'tracking']);
  }
}
