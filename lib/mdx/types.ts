// lib/mdx/types.ts
export type PostFrontmatter = {
  title: string;
  slug?: string;
  date: string;              // ISO
  excerpt: string;
  tags: string[];
  cover?: string;            // or StaticImport path you place under /public
  draft?: boolean;
};

export type PostComputed = {
  slug: string;
  readingTime: { text: string; minutes: number; words: number };
  ogImage: string;           // resolved cover or fallback OG generator URL
  url: string;               // canonical /blog/[slug]
};

export type Post = PostFrontmatter & PostComputed & {
  body: string;              // raw MDX source (for compile)
  _filepath: string;         // absolute path to the .mdx file
};

export type PostListItem = Omit<Post, "body">;
