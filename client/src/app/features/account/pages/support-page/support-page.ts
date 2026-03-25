import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

type SupportFaq = { question: string; answer: string; open: boolean };

@Component({
  selector: 'app-support-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'support-page.html',
  styleUrls: ['support-page.css'],
})
export class SupportPageComponent {
  faqs: SupportFaq[] = [
    {
      question: 'Làm sao để theo dõi trạng thái đơn hàng của tôi?',
      answer:
        'Bạn có thể xem trạng thái đơn hàng trong mục “Đơn hàng của tôi”. Nếu cần hỗ trợ thêm, hãy gửi yêu cầu ở kênh liên hệ trong phần hỗ trợ.',
      open: false,
    },
    {
      question: 'Nếu thanh toán thất bại thì phải làm gì?',
      answer:
        'Hãy thử lại sau vài phút và đảm bảo thông tin thanh toán đúng. Nếu vấn đề vẫn tiếp diễn, hãy gửi phản hồi để đội ngũ hỗ trợ kiểm tra.',
      open: false,
    },
    {
      question: 'Thời gian xử lý và giao hàng mất bao lâu?',
      answer:
        'Thời gian xử lý phụ thuộc vào trạng thái kho và khu vực giao hàng. Bạn có thể xem thông tin vận chuyển trong chính sách giao hàng để biết dự kiến thời gian.',
      open: false,
    },
    {
      question: 'Chính sách đổi trả / hoàn tiền của Kanila có gì nổi bật?',
      answer:
        'Bạn có thể xem chi tiết trong mục “Đổi trả / hoàn tiền”. Nếu cần tư vấn theo trường hợp cụ thể, hãy liên hệ hỗ trợ để được hướng dẫn.',
      open: false,
    },
    {
      question: 'Tôi cần cập nhật địa chỉ giao hàng thì làm thế nào?',
      answer:
        'Bạn có thể quản lý địa chỉ trong mục “Địa chỉ giao hàng”. Khi đặt hàng, bạn cũng có thể chọn địa chỉ phù hợp cho từng lần checkout.',
      open: false,
    },
  ];

  categories = [
    {
      icon: 'bi bi-bag-check',
      title: 'Theo dõi đơn hàng',
      desc: 'Xem trạng thái, chi tiết và hành động cần thiết.',
      href: '/account/orders',
    },
    {
      icon: 'bi bi-credit-card-2-front',
      title: 'Thanh toán & hóa đơn',
      desc: 'Tìm hiểu phương thức thanh toán khi checkout.',
      href: '/account/payment-methods',
    },
    {
      icon: 'bi bi-truck',
      title: 'Giao hàng',
      desc: 'Chính sách vận chuyển và dự kiến thời gian.',
      href: '/help-center/policies/shipping',
    },
    {
      icon: 'bi bi-arrow-repeat',
      title: 'Đổi trả / hoàn tiền',
      desc: 'Điều kiện và hướng dẫn theo chính sách.',
      href: '/help-center/policies/return',
    },
    {
      icon: 'bi bi-shield-lock',
      title: 'Tài khoản & bảo mật',
      desc: 'Bảo vệ tài khoản, cập nhật thông tin quan trọng.',
      href: '/account/security',
    },
    {
      icon: 'bi bi-chat-dots',
      title: 'Liên hệ hỗ trợ',
      desc: 'Gửi yêu cầu để Kanila hỗ trợ nhanh nhất.',
      href: '/help-center/feedback',
    },
  ];

  trackByIndex(index: number, _row: SupportFaq): number {
    return index;
  }

  toggleFaq(index: number): void {
    this.faqs = this.faqs.map((f, i) => ({ ...f, open: i === index ? !f.open : false }));
  }
}

