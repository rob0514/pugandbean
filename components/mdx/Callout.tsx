export function Callout({ type = "note", children }:{ type?: "note"|"warn"|"tip"; children: React.ReactNode }) {
  const styles = {
    note: "border-blue-200 bg-blue-50",
    warn: "border-amber-200 bg-amber-50",
    tip:  "border-emerald-200 bg-emerald-50",
  }[type];
  return (
    <div className={`my-6 rounded-lg border p-4 ${styles}`}>
      {children}
    </div>
  );
}
