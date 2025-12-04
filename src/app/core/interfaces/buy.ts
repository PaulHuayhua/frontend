export interface Buy {
  identifier?: number;
  code?: string;
  buysDate?: string;
  totalPrice?: number;
  user_identifier: number;
  supplier_identifier: number;
  payment_method: string;
  status?: string; 
  details: BuyDetail[];
}

export interface BuyDetail {
  identifier?: number;
  amount: number;
  unitCost: number;
  subtotal?: number;
  product_identifier: number;
  productName?: string; // Para mostrar en UI
}