import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, timeout, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    timeout(20000),
    catchError((error) => {
      const message =
        error?.error?.message ||
        error?.message ||
        'Something went wrong. Please try again.';

      return throwError(() => ({
        ...error,
        friendlyMessage: message
      }));
    })
  );
};