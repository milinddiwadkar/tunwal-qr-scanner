import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('admin_token');

  const isAdminApi = req.url.includes('/api/admin/') && !req.url.endsWith('/admin/login');

  if (token && isAdminApi) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};