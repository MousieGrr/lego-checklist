import type { BricklinkXmlItem, LegoSetPartWithFilledQuantity } from "./types";

/** Generates an XML string in the Bricklink format from the specified Rebrickable parts */
export function generateBricklinkXmlFromRebrickableParts(
  parts: LegoSetPartWithFilledQuantity[],
  options?: ConvertOptions,
): string {
  const items = parts.map((part) => convertToBricklinkXmlItem(part, options));
  return generateBricklinkXmlFromBricklinkXmlItems(items);
}

/** Generates an XML string in the Bricklink format from the specified Bricklink XML items */
function generateBricklinkXmlFromBricklinkXmlItems(
  items: BricklinkXmlItem[],
): string {
  const xmlParts = items
    .map(
      (item) => `
        <ITEM>
            <ITEMTYPE>${item.itemType}</ITEMTYPE>
            <ITEMID>${item.itemId}</ITEMID>
            ${item.color !== undefined ? `<COLOR>${item.color}</COLOR>` : ""}
            ${item.maxPrice !== undefined ? `<MAXPRICE>${item.maxPrice}</MAXPRICE>` : ""}
            ${item.minQty !== undefined ? `<MINQTY>${item.minQty}</MINQTY>` : ""}
            ${item.qtyFilled !== undefined ? `<QTYFILLED>${item.qtyFilled}</QTYFILLED>` : ""}
            ${item.condition !== undefined ? `<CONDITION>${item.condition}</CONDITION>` : ""}
            ${item.notify !== undefined ? `<NOTIFY>${item.notify ? "Y" : "N"}</NOTIFY>` : ""}
            ${item.wantedshow !== undefined ? `<WANTEDSHOW>${item.wantedshow ? "Y" : "N"}</WANTEDSHOW>` : ""}
            ${item.wantedlistid !== undefined ? `<WANTEDLISTID>${item.wantedlistid}</WANTEDLISTID>` : ""}
        </ITEM>
    `,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<INVENTORY>
${xmlParts}
</INVENTORY>`;
}

type ConvertOptions = Pick<
  BricklinkXmlItem,
  "condition" | "notify" | "wantedshow" | "wantedlistid"
>;

/** Converts a Rebrickable Lego set part to a Bricklink XML item */
function convertToBricklinkXmlItem(
  part: LegoSetPartWithFilledQuantity,
  options?: ConvertOptions,
): BricklinkXmlItem {
  return {
    itemType: "P",
    itemId: part.part.external_ids.BrickLink[0],
    condition: options?.condition ?? "N",
    color: part.color.external_ids.BrickLink.ext_ids[0].toString(),
    minQty: part.quantity,
    qtyFilled: part.quantityFilled,
    notify: options?.notify,
    wantedshow: options?.wantedshow,
    wantedlistid: options?.wantedlistid,
  };
}
