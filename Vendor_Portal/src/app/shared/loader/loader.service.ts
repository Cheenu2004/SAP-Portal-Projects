import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private requestCount = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  
  isLoading$ = this.isLoadingSubject.asObservable();

  show() {
    if (this.requestCount === 0) {
      this.isLoadingSubject.next(true);
    }
    this.requestCount++;
  }

  hide() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.isLoadingSubject.next(false);
    }
  }
}
