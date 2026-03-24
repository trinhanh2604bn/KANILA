import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-global-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-toast.html',
  styleUrl: './global-toast.css',
})
export class GlobalToastComponent {
  constructor(public readonly toastService: ToastService) {}
}
