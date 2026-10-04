import { generateBricklinkXmlFromRebrickableParts } from "../bricklink-xml/generate";
import type { LegoSetPartWithFilledQuantity } from "../bricklink-xml/types";

/** Trigger a download of a Bricklink XML file, containing the specified parts */
export function downloadParts(
  filename: string,
  parts: LegoSetPartWithFilledQuantity[],
) {
  const xmlContent = generateBricklinkXmlFromRebrickableParts(parts);
  downloadXmlFile(filename, xmlContent);
}

/** Trigger a download of an XML file with the specified filename and content */
function downloadXmlFile(filename: string, content: string) {
  downloadFile(filename, content, "application/xml");
}

/** Trigger a file download (with the specified filename, content, and MIME type) by creating a temporary link element and clicking it */
function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
