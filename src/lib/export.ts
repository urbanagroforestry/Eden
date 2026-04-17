import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildConceptPdf(payload: {
  projectName: string;
  siteSummary: string[];
  layers: { layer: string; plants: string[] }[];
  support: string[];
  phasedPlan: string[];
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let y = 760;

  const draw = (text: string, size = 11, color = rgb(0.15, 0.2, 0.16)) => {
    page.drawText(text, { x: 40, y, size, font, color });
    y -= size + 6;
  };

  draw(`Food Forest Forge Concept Plan: ${payload.projectName}`, 16, rgb(0.1, 0.3, 0.15));
  draw("Concept planning only. Verify utilities, codes, and structural constraints on-site.", 9, rgb(0.45, 0.2, 0.2));
  y -= 4;

  draw("Site Summary", 13);
  payload.siteSummary.forEach((s) => draw(`• ${s}`));

  y -= 6;
  draw("Recommended Species by 7 Layers", 13);
  payload.layers.forEach((l) => draw(`${l.layer}: ${l.plants.join(", ") || "No high-confidence picks"}`, 10));

  y -= 6;
  draw("Support / Ecological Companions", 13);
  draw(payload.support.join(", ") || "None selected", 10);

  y -= 6;
  draw("Phased Implementation", 13);
  payload.phasedPlan.forEach((p) => draw(`• ${p}`, 10));

  return Buffer.from(await pdf.save());
}
