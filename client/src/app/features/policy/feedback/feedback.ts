import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-feedback',
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.html',
  styleUrl: './feedback.css',
})
export class Feedback {

  formData = {
    type: 'feedback',
    name: '',
    email: '',
    subject: 'Chất lượng sản phẩm',
    description: ''
  };


  subjectOptions: string[] = [
    'Chất lượng sản phẩm',
    'Dịch vụ vận chuyển',
    'Thái độ nhân viên chăm sóc',
    'Lỗi website / Thanh toán',
    'Khác'
  ];


  submitForm() {

    console.log('Dữ liệu người dùng gửi:', this.formData);
    

    alert('Cảm ơn bạn đã gửi phản hồi! KANILA sẽ liên hệ lại với bạn sớm nhất.');
    

    this.formData = {
      type: 'feedback',
      name: '',
      email: '',
      subject: 'Chất lượng sản phẩm',
      description: ''
    };
  }
}