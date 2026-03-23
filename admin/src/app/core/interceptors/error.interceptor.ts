import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(TokenService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'An unexpected error occurred';

      if (err.error?.message) {
        message = err.error.message;
      }

      switch (err.status) {
        case 401:
          tokenService.removeToken();
          router.navigate(['/login']);
          message = 'Session expired. Please log in again.';
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = err.error?.message || 'Resource not found.';
          break;
        case 409:
          message = err.error?.message || 'Duplicate or conflict error.';
          break;
        case 500:
          // Prefer API body (e.g. Mongoose errors); avoid hiding the real message.
          message =
            typeof err.error?.message === 'string' && err.error.message.trim()
              ? err.error.message
              : 'Server error. Please try again later.';
          break;
      }

      toast.error(message);
      return throwError(() => err);
    })
  );
};
