import Image, { StaticImageData } from "next/image";

export default function MDXImage({
  src, alt, caption, width, height, priority,
}: { src: string | StaticImageData; alt: string; caption?: string; width?: number; height?: number; priority?: boolean; }) {
  return (
    <figure className="my-8">
      <Image src={src} alt={alt} width={width ?? 1200} height={height ?? 675} className="rounded-xl" priority={priority} />
      {caption && <figcaption className="mt-2 text-center text-sm opacity-70">{caption}</figcaption>}
    </figure>
  );
}
