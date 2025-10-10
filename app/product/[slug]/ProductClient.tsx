'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Product, ProductOption, Variant } from '@/types/product';

export default function ClientProduct({ product }: { product: Product }) {
  // initialize selection from the first variant’s options
  const [sel, setSel] = useState<Record<string, string>>(
    () => ({ ...(product.variants[0]?.options || {}) })
  );

  // compute matching variant from current selection (stable and fast)
  const matching = useMemo(() => {
    const entries = Object.entries(sel);
    return (
      product.variants.find(v =>
        entries.every(([k, val]) => !val || v.options[k] === val)
      ) || product.variants[0]
    );
  }, [sel, product.variants]);

  const price = matching?.price ?? product.price;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div className="space-y-4">
          {product.images.slice(0, 6).map((url, i) => (
            <div key={url + i} className="relative aspect-square">
              <Image
                src={url}
                alt={product.title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover rounded-2xl"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold">{product.title}</h1>
          <div className="text-2xl">
            {(product.currency ?? 'USD')} {price.toFixed(2)}
          </div>

          <VariantPicker
            options={product.options}
            variants={product.variants}
            sel={sel}
            // both parameters are actively used here, so no underscore needed
            onChange={(optId, val) => setSel(s => ({ ...s, [optId]: val }))}
          />

          <p className="text-sm text-muted-foreground">
            Printful read-only • Variants selectable • Pricing reflects selected variant.
          </p>
        </div>
      </div>
    </main>
  );
}

function VariantPicker({
  options,
  // variants prop is defined in the signature to keep the public API stable,
  // but not used in this implementation. Prefix with underscore to satisfy ESLint.
  variants: _variants,
  sel,
  onChange,
}: {
  options: ProductOption[];
  variants: Variant[]; // keep in the contract for future use
  sel: Record<string, string>;
  onChange: (_optId: string, _value: string) => void;
}) {
  if (!options?.length) return null;

  return (
    <div className="space-y-4">
      {options.map(opt => (
        <div key={opt.id} className="space-y-2">
          <div className="text-sm font-medium">{opt.name}</div>
          <div className="flex flex-wrap gap-2">
            {opt.values.map(val => {
              const active = sel[opt.id] === val;
              return (
                <button
                  key={val}
                  className={`px-3 py-1 rounded-full border ${active ? 'border-foreground' : 'border-border'}`}
                  onClick={() => onChange(opt.id, val)}
                  aria-pressed={active}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
