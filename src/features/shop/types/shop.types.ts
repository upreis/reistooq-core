export interface ShopProduct {
  id: string;
  sku_interno: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  categoria_id?: string;
  preco_venda: number;
  preco_custo?: number;
  quantidade_atual: number;
  estoque_minimo: number;
  url_imagem?: string;
  codigo_barras?: string;
  ativo: boolean;
  tags?: string[];
  rating?: number;
  reviews_count?: number;
  created_at: string;
  updated_at: string;
  organization_id: string;
  // Campos calculados
  isOnSale?: boolean;
  originalPrice?: number;
  discount_percentage?: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  url_imagem: string;
  nome_arquivo?: string;
  principal: boolean;
  ordem: number;
}

export interface ShopFilters {
  search: string;
  categoria?: string;
  priceRange: {
    min?: number;
    max?: number;
  };
  stockStatus?: ('in_stock' | 'low_stock' | 'out_of_stock')[];
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'name' | 'rating' | 'popularity';
  tags?: string[];
  onSale?: boolean;
  page: number;
  limit: number;
}

export interface ShopStats {
  total_products: number;
  categories_count: number;
  avg_rating: number;
  total_reviews: number;
  on_sale_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface ShopCategory {
  id: string;
  nome: string;
  icone?: string;
  cor?: string;
  products_count: number;
  ativo: boolean;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  selected_options?: Record<string, string>;
}

export interface Cart {
  items: CartItem[];
  total_items: number;
  total_value: number;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  product_id: string;
  added_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment?: string;
  created_at: string;
  verified_purchase: boolean;
}

export interface ShopConfig {
  currency: string;
  tax_rate: number;
  shipping_cost: number;
  free_shipping_threshold: number;
  allow_backorders: boolean;
  show_stock_count: boolean;
  enable_reviews: boolean;
  enable_wishlist: boolean;
}