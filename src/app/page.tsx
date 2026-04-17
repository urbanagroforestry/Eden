import Link from "next/link";

const layers = ["Canopy", "Low-tree", "Shrub", "Herbaceous", "Groundcover", "Rhizosphere", "Vertical"];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="card p-8 bg-gradient-to-br from-white to-emerald-50">
        <h1 className="text-4xl font-bold text-moss">Design edible landscapes with geospatial clarity.</h1>
        <p className="mt-3 max-w-3xl text-lg text-bark/80">Food Forest Forge helps you map your lot, correct shade uncertainty, and generate transparent 7-layer food forest concepts you can edit and export.</p>
        <div className="mt-5 flex gap-3">
          <Link href="/design/new" className="rounded-lg bg-moss px-4 py-2 text-white">Start a new design</Link>
          <Link href="/library" className="rounded-lg border border-moss px-4 py-2 text-moss">Browse plant library</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Map + boundary editor", "Search U.S. addresses, drop a pin fallback, draw a lot polygon, and validate geometry."],
          ["Deterministic recommendation engine", "Rule-based scoring by survivability, shade, constraints, and project objectives."],
          ["Transparent confidence model", "Each inferred attribute is labeled as inferred, user-corrected, or verify-on-site."]
        ].map(([title, body]) => (
          <article className="card p-5" key={title}><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-bark/75">{body}</p></article>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="text-2xl font-semibold text-moss">How the 7-layer model works</h2>
        <p className="mt-2 text-sm text-bark/80">The app organizes recommendations by the classic food forest layers, then adds optional support species for pollination, nitrogen fixation, and biodiversity.</p>
        <div className="mt-4 flex flex-wrap gap-2">{layers.map((l) => <span key={l} className="badge border-emerald-300 bg-emerald-50">{l}</span>)}</div>
      </section>

      <section className="card border-amber-200 bg-amber-50 p-5 text-sm">
        <h3 className="font-semibold text-amber-900">Scientific honesty</h3>
        <p className="mt-2 text-amber-900/80">This is concept-planning software. It is not legal, engineering, utility-locate, or stamped landscape architecture advice. Verify conditions on site before installation.</p>
      </section>
    </div>
  );
}
