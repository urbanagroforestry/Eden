export default function AboutPage() {
  return (
    <div className="space-y-4 card p-6">
      <h1 className="text-2xl font-semibold text-moss">About Food Forest Forge</h1>
      <p>Food Forest Forge is a geospatial concept planning tool for edible ecosystems. It deliberately combines inference with user correction instead of pretending to know site reality perfectly.</p>
      <ul className="list-disc pl-6 text-sm text-bark/80">
        <li>Deterministic recommendation logic (no black-box LLM outputs in v1).</li>
        <li>7-layer food forest first, optional support species second.</li>
        <li>Adapter-ready architecture for future USDA/NOAA/EPA/USGS integrations.</li>
      </ul>
    </div>
  );
}
