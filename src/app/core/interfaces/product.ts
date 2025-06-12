export interface Product {
  identifier: number;   
  name: string;
  description: string;
  size?: string | null;
  stock: number;
  price: number;
  expiration_date?: string | null;
  category: string;
  state: boolean;
}
