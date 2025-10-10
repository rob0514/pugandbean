export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose prose-neutral max-w-none
      prose-headings:font-semibold prose-headings:tracking-tight
      prose-img:rounded-xl prose-figcaption:text-sm prose-figcaption:opacity-70
      prose-pre:bg-black prose-pre:text-white">
      {children}
    </div>
  );
}
