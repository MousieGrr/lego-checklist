import type { LegoSetPart } from "../rebrickable-api/types";

export type BricklinkXmlItem = {
  /** Must be one of the following: S (for a set), P (for a part), M (for a minifigure), B (for a book), G (for a gear item), C (for a catalog), I (for an instruction manual), or O (for an original box) */
  itemType: "S" | "P" | "M" | "B" | "G" | "C" | "I" | "O";
  /** The Item No. for this item in the BrickLink catalog */
  itemId: string;
  /** This element is only needed when this item is a part or a gear item that is wanted in a specific color. */
  color?: string;
  /** This element is only needed when this item is wanted for less than or equal to a specific maximum price. */
  maxPrice?: number;
  /** This element is only needed when a specific minimum quantity of this item is wanted. */
  minQty?: number;
  /** This is the quantity of the item that you already have. Filling in this section will allow you to make progress toward completing a wanted list. */
  qtyFilled?: number;
  /** This element is only needed when this item is wanted in a specific condition. Value must be either N (for new) or U (for used) */
  condition?: "N" | "U";
  /** This element is only needed when a notification by email is wanted for any new lots of this item that are listed for sale. */
  notify?: boolean;
  /**
   * If true or undefined, this item will be shown in "item for sale" queries, false to exclude it.
   * @default true
   */
  wantedshow?: boolean;
  /**
   * The ID of the wanted list of which this item should be added.
   */
  wantedlistid?: string;
};

export type LegoSetPartWithFilledQuantity = LegoSetPart & {
  /** The quantity of this part that has already been filled or obtained. */
  quantityFilled?: number;
};
