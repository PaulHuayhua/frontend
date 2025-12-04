import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Supplier } from '../interfaces/supplier';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {

  private http = inject(HttpClient);
  private urlBackEnd = `${environment.urlBackEnd}/v1/api/supplier`;

  private selectedSupplierSubject = new BehaviorSubject<Supplier | null>(null);
  selectedSupplier$ = this.selectedSupplierSubject.asObservable();

  setSelectedSupplier(supplier: Supplier | null): void {
    this.selectedSupplierSubject.next(supplier);
  }

  findAll() {
    return this.http.get<Supplier[]>(this.urlBackEnd);
  }

  findById(identifier: number) {
    return this.http.get<Supplier>(`${this.urlBackEnd}/${identifier}`);
  }

  findByState(state: string) {
    return this.http.get<Supplier[]>(`${this.urlBackEnd}/state/${state}`);
  }

  save(supplier: Supplier) {
    return this.http.post<Supplier>(`${this.urlBackEnd}/save`, supplier);
  }

  update(supplier: Supplier) {
    return this.http.put<Supplier>(`${this.urlBackEnd}/update`, supplier);
  }

  delete(identifier: number) {
    return this.http.patch<Supplier>(`${this.urlBackEnd}/delete/${identifier}`, {});
  }

  restore(identifier: number) {
    return this.http.patch<Supplier>(`${this.urlBackEnd}/restore/${identifier}`, {});
  }
  reportPdf() {
    return this.http.get(`${this.urlBackEnd}/pdf`, { responseType: 'blob' });
  }


}
