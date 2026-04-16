export interface Product {
    id?: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    image_url?: string;
    created_at?: string;
  }
  
  export type Category = 'Makanan' | 'Minuman' | 'Coffe' | 'Cemilan' |'Condiment';

  export interface CartItem extends Product {
    quantity: number;
  }