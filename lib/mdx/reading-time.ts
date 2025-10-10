import rt from "reading-time";
export function computeReadingTime(source: string) {
  return rt(source);
}
