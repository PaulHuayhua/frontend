import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Customer } from '../interfaces/customer';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private http = inject(HttpClient);
  private urlBackEnd = `${environment.urlBackEnd}/v1/api/customer`;

  private selectedCustomerSubject = new BehaviorSubject<Customer | null>(null);
  selectedCustomer$ = this.selectedCustomerSubject.asObservable();

  setSelectedCustomer(customer: Customer | null): void {
    this.selectedCustomerSubject.next(customer);
  }

  findAll() {
    return this.http.get<Customer[]>(this.urlBackEnd);
  }

  findById(identifier: number) {
    return this.http.get<Customer>(`${this.urlBackEnd}/${identifier}`);
  }

  findByState(state: string) {
    return this.http.get<Customer[]>(`${this.urlBackEnd}/state/${state}`);
  }

  save(customer: Customer) {
    return this.http.post<Customer>(`${this.urlBackEnd}/save`, customer);
  }

  update(customer: Customer) {
    return this.http.put<Customer>(`${this.urlBackEnd}/update`, customer);
  }

  softDelete(identifier: number) {
    return this.http.put<Customer>(`${this.urlBackEnd}/delete/${identifier}`, {});
  }

  restore(identifier: number) {
    return this.http.put<Customer>(`${this.urlBackEnd}/restore/${identifier}`, {});
  }

  searchByName(name: string) {
    return this.http.get<Customer[]>(`${this.urlBackEnd}/search`, {
      params: { name }
    });
  }
}
