import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-faq',
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
})
export class Faq {
faqs = [
    { 
      question: 'Tại Sao Đơn Hàng Của Tôi Chưa Cập Nhật Trạng Thái?',
      answer: `Thông thường mất 24-48 giờ làm việc để hệ thống vận chuyển cập nhật. Nếu quá thời gian này, bạn vui lòng liên hệ Bộ phận CSKH Kanila kèm mã đơn hàng để được kiểm tra trực tiếp.`,
      isExpanded: false
    },
    { 
      question: 'Tại Sao Voucher Của Tôi Bị Lại Biến Mất Dù Chưa Được Sử Dụng?',
      answer: `Mỗi voucher đều có hạn sử dụng và số lượng nhất định. Rất có thể voucher của bạn đã hết hạn hoặc hết lượt sử dụng chung. Bạn vui lòng kiểm tra lại điều kiện voucher nhé.`,
      isExpanded: false
    },
    { 
      question: 'Nếu Shipper Giao Hàng Mà Tôi Không Có Nhà/Không Nghe Máy Thì Sao?',
      answer: `Shipper sẽ cố gắng gọi lại và giao lại cho bạn vào ngày làm việc kế tiếp (thường 2 - 3 lần). Nếu sau nhiều lần vẫn không liên lạc được, đơn hàng sẽ bị hoàn trả về cho Kanila.`,
      isExpanded: false
    },
    { 
      question: 'Kanila Có Giao Hàng Toàn Quốc Không?',
      answer: `Kanila hỗ trợ giao hàng tận nơi trên toàn quốc và hợp tác với các đơn vị vận chuyển uy tín.`,
      isExpanded: false
    },
    { 
      question: 'Tôi Có Thể Thanh Toán Bằng Những Hình Thức Nào?',
      answer: `Kanila hỗ trợ 2 hình thức chính: Thanh toán khi nhận hàng (COD) và chuyển khoản ngân hàng.`,
      isExpanded: false
    },
    { 
      question: 'Nếu Da Tôi Bị Kích Ứng Khi Dùng Sản Phẩm Thì Sao?',
      answer: `Bạn vui lòng ngừng sử dụng sản phẩm ngay lập tức và liên hệ hotline của Kanila. Chúng tôi sẽ tư vấn và hỗ trợ bạn theo chính sách của chúng tôi.`,
      isExpanded: false
    },
    { 
      question: 'Tôi Có Thể Xem Đánh Giá Của Khách Hàng Khác Trước Khi Mua Không?',
      answer: `Hoàn toàn có thể. Ngay bên dưới mỗi sản phẩm, Kanila có mục "Đánh giá" để xem xét nhận xét và hình ảnh thực tế từ các khách hàng đã mua trước đó.`,
      isExpanded: false
    },
    { 
      question: 'Nếu Tôi Mua Hàng Nhiều Lần, Kanila Có Lưu Lại Lịch Sử Màu Sắc Hay Sản Phẩm Tôi Từng Chọn Không?',
      answer: `Có ạ. Nếu bạn tạo tài khoản và đăng nhập khi mua hàng, hệ thống sẽ tự động lưu lại lịch sử đơn hàng, giúp bạn dễ dàng xem lại và mua lại sản phẩm yêu thích.`,
      isExpanded: false
    },
    { 
      question: 'Tôi Đã Thêm Sản Phẩm Vào Giỏ Mà Hôm Sau Hết Hàng — Có Cách Nào Giữ Trước Hoặc Đặt Chỗ Không?',
      answer: `Rất tiếc, Kanila không hỗ trợ giữ hàng trong giỏ. Sản phẩm chỉ được giữ cho bạn khi đơn hàng đã được xác nhận.`,
      isExpanded: false
    },
    { 
      question: 'Nếu Sản Phẩm Tôi Mua Bị Lỗi Thiết Kế Nhưng Vẫn Dùng Được, Có Được Đổi Không?',
      answer: `Kanila hỗ trợ đổi trả theo chính sách. Bạn vui lòng gửi hình ảnh/video sản phẩm bị lỗi cho bộ phận CSKH, chúng tôi sẽ xem xét và hỗ trợ bạn đổi sản phẩm mới.`,
      isExpanded: false
    }
  ];

  toggleFaq(index: number) {
    this.faqs.forEach((faq, i) => {
      if (i === index) {
        faq.isExpanded = !faq.isExpanded;
      } else {
        faq.isExpanded = false;
      }
    });
  }
}