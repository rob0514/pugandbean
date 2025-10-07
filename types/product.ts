// LEGACY SHAPE — matches your existing UI + mock JSON

export type ProductOption = {
  id: string;            // "size", "color"
  name: string;          // "Size", "Color"
  values: string[];
};

export type Variant = {
  id: string;
  sku?: string;
  title: string;         // e.g., "Black / M"
  options: Record<string, string>;
  price: number;         // plain number
  image?: string;        // url
  currency?: string;     // optional
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  descriptionMdxPath?: string;
  price: number;         // plain number
  currency?: string;     // optional
  images: string[];      // urls
  options: ProductOption[];
  variants: Variant[];
  tags: string[];
};
