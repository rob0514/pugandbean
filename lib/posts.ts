import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'


const BLOG_DIR = path.join(process.cwd(), 'content/blog')


export type PostMeta = {
title: string
date: string
slug: string
tags?: string[]
excerpt?: string
cover?: string
}


export async function listPosts(): Promise<PostMeta[]> {
const files = await fs.readdir(BLOG_DIR)
const posts = await Promise.all(
files.filter(f => f.endsWith('.mdx')).map(async (file) => {
const raw = await fs.readFile(path.join(BLOG_DIR, file), 'utf8')
const { data } = matter(raw)
return data as PostMeta
})
)
return posts.sort((a, b) => +new Date(b.date) - +new Date(a.date))
}


export async function getPostBySlug(slug: string) {
const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
const raw = await fs.readFile(filePath, 'utf8')
const { data, content } = matter(raw)
return { ...(data as PostMeta), content }
}