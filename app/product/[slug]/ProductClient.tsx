"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { Product, ProductOption, Variant } from "@/types/product";
import AddToCart from "./AddToCart";

export default function ClientProduct({ product }: { product: Product }) {
  // initialize selection from first variant’s *normalized option ids*
//const initialSel = product.variants[0]?.options ?? {};
const [sel, setSel] = useState<Record<string, string>>(
  () => Object.fromEntries((product.options ?? []).map(o => [o.id, ""]))
);
const allSelected = (product.options ?? []).every(o => !!sel[o.id]);

const matching = useMemo(() => {
  if (!allSelected) return undefined;
  const entries = Object.entries(sel);
  return product.variants.find(v =>
    entries.every(([k, val]) => v.options[k] === val)
  );
}, [allSelected, sel, product.variants]);

  const activePrice = matching?.price ?? product.price;

  //const productId = product.id;
  //const variantId = matching?.id ?? "default";

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
            {(product.currency ?? "USD")} {allSelected ? activePrice.toFixed(2) : product.price.toFixed(2)}
          </div>

          <VariantPicker
            options={product.options}
            variants={product.variants}
            sel={sel}
            onChange={(optId, val) => setSel((s) => ({ ...s, [optId]: val }))}
          />

         <AddToCart
  productId={product.id}
  variantId={matching?.id ?? ""}   // harmless when disabled
  disabled={!matching}
/>

          <p className="text-sm text-muted-foreground">
            Variants selectable • Price updates per selection.
          </p>
        </div>
      </div>
    </main>
  );
}

function VariantPicker({
  options,
  variants,
  sel,
  onChange,
}: {
  options: ProductOption[];
  variants: Variant[];
  sel: Record<string, string>;
  onChange: (optId: string, value: string) => void;
}) {
  if (!options?.length) return null;

  // Precompute valid combinations for quick lookups
  // For each optionId -> value -> whether there's at least one variant that matches current selection+this value
  function isAvailable(optionId: string, value: string): boolean {
    // pretend we picked `value` for optionId, and see if any variant matches all picks
    const candidate = { ...sel, [optionId]: value };
    return variants.some((v) =>
      Object.entries(candidate).every(([k, picked]) => !picked || v.options[k] === picked)
    );
  }

  return (
    <div className="space-y-4">
      {options.map((opt) => (
        <div key={opt.id} className="space-y-2">
          <div className="text-sm font-medium">{opt.name}</div>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((val) => {
              const active = sel[opt.id] === val;
              const available = isAvailable(opt.id, val);
              const clsBase =
                "px-3 py-1 rounded-full border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
              const clsState = active
                ? "bg-[#1C1C1C] text-white border-[#1C1C1C]"
                : available
                ? "bg-white text-black border-neutral-300 hover:border-neutral-500"
                : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60";
              return (
                <button
                  key={val}
                  type="button"
                  className={`${clsBase} ${clsState}`}
                  onClick={() => available && onChange(opt.id, val)}
                  aria-pressed={active}
                  aria-disabled={!available}
                  disabled={!available}
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
