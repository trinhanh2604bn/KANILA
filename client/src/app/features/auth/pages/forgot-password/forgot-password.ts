import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  step = 1;
  email = '';
  otp: string = '';
  newPass = '';
  confirmPass = '';
  
  emailNotFound = false;
  otpError: boolean = false;
   isMismatch = false;
   otpSuccess: boolean = false;

  private otpVerifying = false;



  constructor(private router: Router, private authService: AuthService) {}

  sendEmail() {
    const email = this.email.trim().toLowerCase();
    if (!email || !this.isValidEmail(email)) {
      this.emailNotFound = true;
      return;
    }
    this.email = email;
    this.otpError = false;
    this.otpSuccess = false;
    this.isMismatch = false;
    this.otp = '';

    this.authService.checkEmail(this.email).subscribe({
      next: (res) => {
        if (res.exists) {
          this.step = 2; 
          this.emailNotFound = false;
        } else {
          this.emailNotFound = true; 
        }
      },
      error: (err) => {
        this.emailNotFound = true;
        console.error("Lỗi kết nối Server:", err);
      }
    });
  }

  onOtpChange() {
    this.otpError = false;
    this.otpSuccess = false;
    const otp = String(this.otp || '').trim();
    if (!otp) return;
    if (otp.length < 6) return;
    if (!/^\d{6}$/.test(otp)) return;
    // Do not mark success here; OTP is verified on click (avoids hard-coded defaults).
    this.otpSuccess = true;
  }

  verifyOtp() {
    if (this.otpVerifying) return;
    const otp = String(this.otp || '').trim();
    if (!/^\d{6}$/.test(otp)) {
      this.otpError = true;
      this.otpSuccess = false;
      return;
    }

    this.otpVerifying = true;
    this.authService.verifyResetOtp(this.email, otp).subscribe({
      next: () => {
        this.step = 3;
        this.otpError = false;
        this.otpSuccess = false;
        this.otpVerifying = false;
      },
      error: () => {
        this.otpError = true;
        this.otpSuccess = false;
        this.otpVerifying = false;
      },
    });
  }

  reload() { 
    window.location.reload();
  }

  onConfirmChange() {
    if (!this.confirmPass) {
      this.isMismatch = false; 
    } else {
      this.isMismatch = this.newPass !== this.confirmPass;
    }
  }

  submitReset() {
    if (this.newPass.length < 8) {
      alert("Mật khẩu yêu cầu tối thiểu 8 ký tự!");
      return;
    }
    if (this.isMismatch || !this.newPass || !this.confirmPass) return;

    this.authService.resetPassword(this.email, this.otp, this.newPass).subscribe({
      next: (res) => {
        alert("Bạn đã đặt lại mật khẩu thành công");
        this.router.navigate(['/auth/login']); 
      },
      error: (err) => {
        alert("Có lỗi xảy ra trong quá trình đặt lại mật khẩu. Vui lòng thử lại!");
      }
    });
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }
}

