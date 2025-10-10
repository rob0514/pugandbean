import type { ComponentProps, ReactNode } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import type { MDXComponents } from "mdx/types";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";

import { Prose } from "@/components/mdx/Prose";
import { CodeBlock } from "@/components/mdx/CodeBlock";
import { Callout } from "@/components/mdx/Callout";
import MDXImage from "@/components/mdx/MDXImage";

// Intrinsic element prop helpers
type PreProps = ComponentProps<"pre">;
type CodeProps = ComponentProps<"code">;

const components: MDXComponents = {
  pre: (props: PreProps) => (
    <div className="not-prose">
      <pre {...props} />
    </div>
  ),
  code: (props: CodeProps) => <CodeBlock {...props} />,
  Callout,           // already typed in its own file
  MDXImage,          // already typed in its own file
  wrapper: ({ children }: { children: ReactNode }) => <Prose>{children}</Prose>,
};

export async function renderMDX(source: string) {
  const { content } = await compileMDX({
    source,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolink, { behavior: "wrap" }],
          [rehypePrettyCode, { theme: "github-dark" }],
        ],
      },
    },
    components,
  });

  return content; // ReactNode
}
