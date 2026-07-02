import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoaderService } from '../../shared/loader/loader.service';
import { finalize } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  loaderService.show();
  
  // We can add auth headers here if needed, but OData might use cookies or basic auth
  // which browser handles, or we can add WfVendorId to headers.
  
  const clonedReq = req.clone({
    setHeaders: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });

  return next(clonedReq).pipe(
    finalize(() => {
      loaderService.hide();
    })
  );
};
