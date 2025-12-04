import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cellNumber'
})
export class CellNumberPipe implements PipeTransform {

  transform(value: string | number | null | undefined): string {
    if (!value) return '';
    const phone = value.toString().trim();

    if (phone.startsWith('+51')) return phone;

    const cleanPhone = phone.startsWith('0') ? phone.substring(1) : phone;

    return `+51 ${cleanPhone}`;
  }

}
