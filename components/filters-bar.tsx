'use client'
import { useRouter, useSearchParams } from 'next/navigation'


export function FiltersBar({ tags, activeTag }: { tags: string[]; activeTag?: string }) {
const router = useRouter()
const params = useSearchParams()
function toggle(tag?: string) {
const p = new URLSearchParams(params.toString())
if (!tag) p.delete('tag')
else p.set('tag', tag)
router.push(`/shop?${p.toString()}`)
}
return (
<div className="mt-4 flex flex-wrap gap-2">
<button onClick={() => toggle()} className={`px-3 py-1 rounded-full border ${!activeTag ? 'bg-ink text-cream' : 'bg-white'}`}>All</button>
{tags.map(t => (
<button key={t} onClick={() => toggle(t)} className={`px-3 py-1 rounded-full border ${activeTag===t ? 'bg-ink text-cream' : 'bg-white'}`}>{t}</button>
))}
</div>
)
}