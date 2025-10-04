export type Product = {
id: string
slug: string
title: string
price: number // cents
images: string[]
options?: { name: string; values: string[] }[]
variants?: { sku: string; options: Record<string, string> }[]
tags?: string[]
summary?: string
descriptionMdxPath?: string
}