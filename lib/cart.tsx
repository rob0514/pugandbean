'use client'
import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import type { Product } from '@/types/product'


type CartItem = Pick<Product, 'id' | 'title' | 'price'> & { quantity: number }


type CartCtx = {
isOpen: boolean
open: () => void
close: () => void
items: CartItem[]
add: (p: Product) => void
remove: (index: number) => void
total: number
}


const Ctx = createContext<CartCtx | null>(null)


export function CartProvider({ children }: { children: ReactNode }) {
const [isOpen, setOpen] = useState(false)
const [items, setItems] = useState<CartItem[]>([])


const api: CartCtx = useMemo(() => ({
isOpen,
open: () => setOpen(true),
close: () => setOpen(false),
items,
add: (p) => { setItems(prev => {
const idx = prev.findIndex(i => i.id === p.id)
if (idx > -1) {
const copy = [...prev]; copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 }; return copy
}
return [...prev, { id: p.id, title: p.title, price: p.price, quantity: 1 }]
}); setOpen(true) },
remove: (index) => setItems(prev => prev.toSpliced(index, 1)),
total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}), [isOpen, items])


return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}


export function useCart() {
const ctx = useContext(Ctx)
if (!ctx) throw new Error('useCart must be used within CartProvider')
return ctx
}