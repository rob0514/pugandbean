import type { ComponentProps } from "react";

export function CodeBlock(props: ComponentProps<"code">) {
  // rehype-pretty-code adds its own markup; keep this thin to avoid hydration warnings
  return <code {...props} />;
}
