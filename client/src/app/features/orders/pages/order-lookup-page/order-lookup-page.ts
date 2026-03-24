import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-lookup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-lookup-page.html',
  styleUrls: ['./order-lookup-page.css'],
})
export class OrderLookupPageComponent {
  orderNumber = '';
  phone = '';
  email = '';
  searching = false;
  error = '';

  constructor(
    private readonly orderService: OrderService,
    private readonly router: Router
  ) {}

  lookup(): void {
    this.error = '';
    const orderNumber = this.orderNumber.trim().toUpperCase();
    if (!orderNumber || (!this.phone.trim() && !this.email.trim())) {
      this.error = 'Vui lòng nhập mã đơn và số điện thoại hoặc email.';
      return;
    }
    this.searching = true;
    this.orderService.lookupGuestOrder(orderNumber, this.phone.trim(), this.email.trim().toLowerCase()).pipe(take(1)).subscribe((result) => {
      this.searching = false;
      if (!result) {
        this.error = 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin.';
        return;
      }
      this.router.navigate(['/orders', result.orderId]);
    });
  }
}
