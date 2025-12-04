import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../interfaces/product';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

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

  // ✅ Traer todos los productos
  findAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.urlBackEnd);
  }

  // ✅ Traer producto por ID
  findById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.urlBackEnd}/${id}`);
  }

  // ✅ Crear nuevo producto
  save(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.urlBackEnd}/save`, product);
  }

  // ✅ Actualizar producto
  update(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.urlBackEnd}/update/${id}`, product);
  }

  // ✅ Desactivar producto
  updateState(id: number): Observable<Product> {
    return this.http.patch<Product>(`${this.urlBackEnd}/delete/${id}`, {});
  }

  // ✅ Restaurar producto
  restoreProduct(id: number): Observable<Product> {
    return this.http.patch<Product>(`${this.urlBackEnd}/restore/${id}`, {});
  }

  // 🚀 Descargar PDF de productos
  reportPdf(): Observable<Blob> {
    return this.http.get(`${this.urlBackEnd}/pdf`, { responseType: 'blob' });
  }
}
