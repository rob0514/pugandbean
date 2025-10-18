import CheckoutButton from "@/components/cart/CheckoutButton";
// Small client island for item interactions
import ClientCart from "./ClientCart";

export const metadata = { title: "Your Cart • Pug & Bean" };

export default function CartPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-medium">Your Cart</h1>
      <ClientCart />
      <div className="pt-4">
        <CheckoutButton />
      </div>
    </main>
  );
}
