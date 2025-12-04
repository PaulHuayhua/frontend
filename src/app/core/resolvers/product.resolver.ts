import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Product } from '../interfaces/product';
import { Observable } from 'rxjs';

export const productResolver: ResolveFn<Product[]> = (): Observable<Product[]> => {
  const productService = inject(ProductService);
  return productService.findAll(); 
};
