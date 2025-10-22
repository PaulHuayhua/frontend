import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'penCurrency',
  standalone: true
})
export class PenCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value == null || value === '') return '-';
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numberValue);
  }
}
