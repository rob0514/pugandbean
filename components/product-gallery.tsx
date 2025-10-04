'use client'
import Image from 'next/image'
import { useState } from 'react'


export function ProductGallery({ images, title }: { images: string[]; title: string }) {
const [active, setActive] = useState(0)
const safe = images?.length ? images : ['/placeholder.png']
return (
<div>
<div className="relative aspect-square rounded-2xl overflow-hidden bg-warmgray">
<Image src={safe[active]} alt={title} fill className="object-cover" />
</div>
{safe.length > 1 && (
<div className="mt-3 grid grid-cols-5 gap-2">
{safe.map((src, i) => (
<button key={i} onClick={() => setActive(i)} className={`relative aspect-square rounded-lg overflow-hidden ${i===active ? 'ring-2 ring-fawn' : ''}`}>
<Image src={src} alt="" fill className="object-cover" />
</button>
))}
</div>
)}
</div>
)
}