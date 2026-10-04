export type PaginatedResponse<T> = {
  /** Total number of items available */
  count: number;
  /** URL to the next page of results, or null if there is no next page */
  next: string | null;
  /** URL to the previous page of results, or null if there is no previous page */
  previous: string | null;
  /** A single page of results */
  results: T[];
};

export type LegoSetPartsResponse = PaginatedResponse<LegoSetPart>;

export type LegoSetPart = {
  /** The unique identifier for this part, within the set. */
  id: string;
  /** The unique identifier for this part, within the inventory. */
  inv_part_id: string;
  /** The part object containing detailed information about the part */
  part: LegoPart;
  /** The color object containing detailed information about the color of this part */
  color: LegoColor;
  /** The set number this part belongs to */
  set_num: string;
  /** The number of pieces of this part/color in the set */
  quantity: number;
  /** True if this part is a spare, otherwise false */
  is_spare: boolean;
  /** The element ID (need to clarify difference between element & part) */
  element_id: string;
  /** The number of sets that feature this part */
  num_sets: number;
};

export type LegoPart = {
  /** The unique identifier for the part (e.g. "48729b") on Rebrickable */
  part_num: string;
  /** Description of the part (e.g. "Bar 1L with Clip [Cut Edges and One Side Hole] [Gap in Clip]") */
  name: string;
  /** The category ID for the part (e.g. 32) */
  part_cat_id: number;
  /** URL to the part's page on Rebrickable (e.g. "https://rebrickable.com/parts/48729b/bar-1l-with-clip-cut-edges-and-one-side-hole-gap-in-clip/") */
  part_url: string;
  /** URL to an image of the part (e.g. "https://cdn.rebrickable.com/media/parts/elements/4289538.jpg") */
  part_img_url: string;
  /** External IDs for the part in various databases. Each entry contains the (multiple) IDs. */
  external_ids: {
    BrickLink: string[];
    BrickOwl: string[];
    Brickset: string[];
    LDraw: string[];
    LEGO: string[];
  };
};

export type LegoColor = {
  /** ID (e.g. 0) */
  id: number;
  /** Name (e.g. "Black") */
  name: string;
  /** RGB color code (e.g. "05131D") */
  rgb: string;
  /** True if the color is transparent, otherwise false */
  is_trans: boolean;
  /** External IDs for the color in various databases. Each entry contains the (multiple) IDs and for each ID its corresponding (multiple) descriptions. */
  external_ids: {
    BrickLink: {
      ext_ids: number[];
      ext_descrs: string[][];
    };
    BrickOwl: {
      ext_ids: number[];
      ext_descrs: string[][];
    };
    LEGO: {
      ext_ids: number[];
      ext_descrs: string[][];
    };
    Peeron: {
      ext_ids: (number | null)[];
      ext_descrs: string[][];
    };
    LDraw: {
      ext_ids: number[];
      ext_descrs: string[][];
    };
  };
};
