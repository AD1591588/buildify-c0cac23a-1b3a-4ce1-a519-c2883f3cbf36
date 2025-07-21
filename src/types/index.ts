
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  model_url: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  is_public?: boolean;
}

export interface UserModel {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  model_url: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TryOnHistory {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export type ProductCategory = 'all' | 'sunglasses' | 'glasses' | 'dresses' | 'shirts' | 'suits' | 'custom';