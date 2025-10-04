import { MDXRemote } from 'next-mdx-remote/rsc'
//import type { ComponentProps } from 'react'
import clsx from 'clsx'


export function Prose({ source, className }: { source: string; className?: string }) {
return (
<div className={clsx('prose prose-neutral', className)}>
<MDXRemote source={source} components={{}} />
</div>
)
}