export function SiteFooter() {
return (
<footer className="mt-16 border-t border-ink/10">
<div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 grid md:grid-cols-2 gap-6">
<p className="text-sm text-ink/70">© {new Date().getFullYear()} Pug & Bean.</p>
<p className="text-sm text-ink/70 md:text-right">Little dogs. Big life.</p>
</div>
</footer>
)
}