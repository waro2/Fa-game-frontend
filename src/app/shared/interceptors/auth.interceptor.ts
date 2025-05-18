import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, take, filter, finalize } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { JwtHelperService } from '@auth0/angular-jwt';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const jwtHelper = inject(JwtHelperService);
  const accessToken = authService.getAccessToken();

  // Ne pas intercepter les requêtes d'authentification
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh') || req.url.includes('/auth/register')) {
    return next(req);
  }

  // Clone et ajoute le header Authorization si token existant
  const authReq = accessToken
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    : req;

  return next(authReq).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !authReq.url.includes('/auth')) {
        return handle401Error(authReq, next, authService, jwtHelper);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  jwtHelper: JwtHelperService
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        const newAccessToken = response.accessToken || response.access_token;
        const newRefreshToken = response.refreshToken || response.refresh_token;

        if (!newAccessToken || !newRefreshToken) {
          authService.logout();
          return throwError(() => new Error('Missing tokens in refresh response'));
        }

        if (isTokenValid(newAccessToken, jwtHelper) && isTokenValid(newRefreshToken, jwtHelper)) {
          authService.storeTokens(newAccessToken, newRefreshToken);
          refreshTokenSubject.next(newAccessToken);

          const newRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${newAccessToken}`,
              'X-Token-Refreshed': 'true'
            }
          });
          return next(newRequest);
        } else {
          authService.logout();
          return throwError(() => new Error('Invalid tokens received'));
        }
      }),
      catchError(err => {
        authService.logout();
        return throwError(() => err);
      }),
      finalize(() => {
        isRefreshing = false;
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => {
      return next(request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      }));
    })
  );
}

function isTokenValid(token: string, jwtHelper: JwtHelperService): boolean {
  try {
    return !!token && !jwtHelper.isTokenExpired(token);
  } catch {
    return false;
  }
}