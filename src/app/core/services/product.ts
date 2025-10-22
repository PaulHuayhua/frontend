import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../interfaces/product';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  
  private http = inject(HttpClient);
  private urlBackEnd = `${environment.urlBackEnd}/v1/api/product`;

  private selectedProductSubject = new BehaviorSubject<Product | null>(null);
  selectedProduct$ = this.selectedProductSubject.asObservable();

  setSelectedProduct(product: Product | null): void {
    this.selectedProductSubject.next(product);
  }

  findAll() {
    return this.http.get<Product[]>(this.urlBackEnd);
  }

  findById(id: number) {
    return this.http.get<Product>(`${this.urlBackEnd}/${id}`);
  }

  save(product: Product) {
    return this.http.post<Product>(`${this.urlBackEnd}/save`, product);
  }

  update(id: number, product: Product) {
    return this.http.put<Product>(`${this.urlBackEnd}/update/${id}`, product);
  }

  updateState(id: number) {
    return this.http.patch<Product>(`${this.urlBackEnd}/delete/${id}`, {});
  }

  restoreProduct(id: number) {
    return this.http.patch<Product>(`${this.urlBackEnd}/restore/${id}`, {});
  }

  reportPdf() {
    return this.http.get(`${this.urlBackEnd}/pdf`, { responseType: 'blob' });
  }
}
