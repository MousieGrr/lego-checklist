import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  LegoSetPart,
  LegoSetPartsResponse,
} from "./rebrickable-api/types";
import { generateBricklinkXmlFromRebrickableParts } from "./bricklink-xml/generate";
import { downloadParts } from "./utils/export";
import type { LegoSetPartWithFilledQuantity } from "./bricklink-xml/types";

const API_KEY = import.meta.env.VITE_REBRICKABLE_API_KEY;
const API_BASE_URL = "https://rebrickable.com/api/v3";

function App() {
  const [setNumber, setSetNumber] = useState<string>("");
  const [currentSetNumber, setCurrentSetNumber] = useState<string>("");
  const [setName, setSetName] = useState<string>("");
  const [parts, setParts] = useState<LegoSetPart[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [checkedItems, setCheckedItems] = useState<Record<string, number>>({});

  // Load set from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setIdFromUrl = params.get("set_id");
    if (setIdFromUrl) {
      setSetNumber(setIdFromUrl);
      // Trigger load automatically
      loadSet(setIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load checked counts from localStorage when current set changes
  useEffect(() => {
    if (currentSetNumber) {
      const savedCounts: Record<string, number> = {};
      parts.forEach((part) => {
        const key = `lego-checklist-${currentSetNumber}-${part.part.part_num}-${part.color.id}`;
        const count = parseInt(localStorage.getItem(key) || "0", 10);
        savedCounts[`${part.part.part_num}-${part.color.id}`] = count;
      });
      setCheckedItems(savedCounts);
    }
  }, [currentSetNumber, parts]);

  const fetchAllParts = async (setNum: string) => {
    let allParts: LegoSetPart[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${API_BASE_URL}/lego/sets/${setNum}/parts/?page=${page}&page_size=1000`,
        {
          headers: {
            Authorization: `key ${API_KEY}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Set not found. Please check the set number and try again.",
          );
        }
        throw new Error(`Error fetching parts: ${response.statusText}`);
      }

      const data = (await response.json()) as LegoSetPartsResponse;
      allParts = [...allParts, ...data.results];

      // Check if there's a next page
      hasMore = data.next !== null;
      page++;
    }

    return allParts;
  };

  const loadSet = async (setNum: string) => {
    if (!setNum.trim()) {
      setError("Please enter a set number");
      return;
    }

    setLoading(true);
    setError("");
    setParts([]);
    setCheckedItems({});
    setSetName("");

    try {
      // Auto-append -1 if not already present
      let normalizedSetNum = setNum.trim();
      if (!normalizedSetNum.match(/-\d+$/)) {
        normalizedSetNum = `${normalizedSetNum}-1`;
      }

      // Fetch set details to get the name
      const setResponse = await fetch(
        `${API_BASE_URL}/lego/sets/${normalizedSetNum}/`,
        {
          headers: {
            Authorization: `key ${API_KEY}`,
          },
        },
      );

      if (!setResponse.ok) {
        if (setResponse.status === 404) {
          throw new Error(
            "Set not found. Please check the set number and try again.",
          );
        }
        throw new Error(
          `Error fetching set details: ${setResponse.statusText}`,
        );
      }

      const setData = await setResponse.json();
      setSetName(setData.name);

      const fetchedParts = await fetchAllParts(normalizedSetNum);

      const fetchedPartsNoSpares = fetchedParts.filter(
        (part) => part.is_spare === false,
      );

      // Check if set has no parts
      if (fetchedPartsNoSpares.length === 0) {
        throw new Error(
          "This set has no parts or is not a valid set number. Please try another set.",
        );
      }

      // Group parts by part_num + color_id and sum their quantities
      const groupedPartsMap = new Map();
      fetchedPartsNoSpares.forEach((part) => {
        const key = `${part.part.part_num}-${part.color.id}`;
        if (groupedPartsMap.has(key)) {
          // Add to existing part's quantity
          const existing = groupedPartsMap.get(key);
          existing.quantity += part.quantity;
        } else {
          // First occurrence of this part/color combo
          groupedPartsMap.set(key, { ...part });
        }
      });

      const groupedParts = Array.from(groupedPartsMap.values());

      setParts(groupedParts);
      setCurrentSetNumber(normalizedSetNum);

      // Update URL with set_id parameter
      const newUrl = `${window.location.pathname}?set_id=${encodeURIComponent(normalizedSetNum)}`;
      window.history.pushState({}, "", newUrl);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setCurrentSetNumber("");
      setSetName("");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadSet(setNumber);
  };

  const handleIncrement = (part: LegoSetPart) => {
    const itemKey = `${part.part.part_num}-${part.color.id}`;
    const storageKey = `lego-checklist-${currentSetNumber}-${part.part.part_num}-${part.color.id}`;
    const currentCount = checkedItems[itemKey] || 0;

    if (currentCount < part.quantity) {
      const newCount = currentCount + 1;
      localStorage.setItem(storageKey, newCount.toString());
      setCheckedItems((prev) => ({
        ...prev,
        [itemKey]: newCount,
      }));
    }
  };

  const handleDecrement = (part: LegoSetPart) => {
    const itemKey = `${part.part.part_num}-${part.color.id}`;
    const storageKey = `lego-checklist-${currentSetNumber}-${part.part.part_num}-${part.color.id}`;
    const currentCount = checkedItems[itemKey] || 0;

    if (currentCount > 0) {
      const newCount = currentCount - 1;
      localStorage.setItem(storageKey, newCount.toString());
      setCheckedItems((prev) => ({
        ...prev,
        [itemKey]: newCount,
      }));
    }
  };

  const checkedCount = Object.values(checkedItems).reduce(
    (sum, count) => sum + count,
    0,
  );

  /** The total number of parts */
  const totalCount = parts.reduce((sum, part) => sum + part.quantity, 0);

  /** The total number of unique parts, considering both part number and color */
  const totalUniquePartsCount = parts.reduce(
    (set, part) => set.add(part.part.part_num + part.color.id),
    new Set(),
  ).size;

  const partsCompleted = parts.map((part) => {
    const itemKey = `${part.part.part_num}-${part.color.id}`;
    const partCheckedCount = checkedItems[itemKey] || 0;
    const allChecked = partCheckedCount === part.quantity;
    return { ...part, allChecked };
  });

  const sortedParts = partsCompleted.sort((a, b) => {
    if (a.allChecked === b.allChecked) {
      return 0;
    }
    if (a.allChecked > b.allChecked) {
      return 1;
    }
    if (a.allChecked < b.allChecked) {
      return -1;
    }

    return 0;
  });

  /** The list of parts with their filled quantities based on the checked items in local storage */
  const exportableParts = useMemo(() => {
    return parts.map<LegoSetPartWithFilledQuantity>((part) => {
      const itemKey = `${part.part.part_num}-${part.color.id}`;
      const partCheckedCount = checkedItems[itemKey] || 0;
      return { ...part, quantityFilled: partCheckedCount };
    });
  }, [parts, checkedItems]);

  /** Callback to handle exporting the parts list as a downloadable XML file */
  const handleExportDownload = useCallback(() => {
    downloadParts(`${setName}.xml`, exportableParts);
  }, [exportableParts]);

  /** Callback to handle copying the parts list as XML to the clipboard */
  const handleExportCopy = useCallback(() => {
    navigator.clipboard.writeText(
      generateBricklinkXmlFromRebrickableParts(exportableParts),
    );
  }, [exportableParts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            LEGO Set Checklist
          </h1>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={setNumber}
              onChange={(e) => setSetNumber(e.target.value)}
              placeholder="Enter set number (e.g., 75192-1)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading..." : "Load Set"}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Progress Bar */}
        {currentSetNumber && parts.length > 0 && (
          <div className="sticky top-0 z-10 mb-6 p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-start gap-4 mb-2">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{setName}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Set {currentSetNumber}
                </p>
              </div>
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                {checkedCount} / {totalCount} parts ({totalUniquePartsCount}{" "}
                unique parts)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Parts Checklist */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading parts...</p>
          </div>
        )}

        {!loading && parts.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {sortedParts.map((part, index) => {
                  const itemKey = `${part.part.part_num}-${part.color.id}`;
                  const partCheckedCount = checkedItems[itemKey] || 0;
                  const allChecked = partCheckedCount === part.quantity;

                  return (
                    <div
                      key={`${part.part.part_num}-${part.color.id}-${index}`}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        allChecked ? "bg-green-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Part Image */}
                        <div className="shrink-0 w-20 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                          {part.part.part_img_url ? (
                            <img
                              src={part.part.part_img_url}
                              alt={part.part.name}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">
                              No image
                            </span>
                          )}
                        </div>

                        {/* Part Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="flex-1">
                              <h3
                                className={`font-medium text-gray-900 ${allChecked ? "line-through" : ""}`}
                              >
                                {part.part.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                Part #{part.part.part_num}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Color: {part.color.name}
                              </p>
                            </div>

                            {/* Add/Remove Buttons */}
                            <div className="flex items-center gap-3 md:ml-4">
                              <button
                                onClick={() => handleDecrement(part)}
                                disabled={partCheckedCount === 0}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-bold text-xl"
                                aria-label="Remove one"
                              >
                                −
                              </button>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-gray-900">
                                  {partCheckedCount}
                                </span>
                                <span className="text-2xl text-gray-400">
                                  /
                                </span>
                                <span className="text-2xl font-bold text-gray-900">
                                  {part.quantity}
                                </span>
                              </div>
                              <button
                                onClick={() => handleIncrement(part)}
                                disabled={partCheckedCount === part.quantity}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-bold text-xl"
                                aria-label="Add one"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Export */}
            <div className="mb-6 p-4 bg-white rounded-lg shadow flex justify-between items-center gap-2 gap-y-4 mt-6 flex-wrap">
              <div className="flex flex-col gap-1">
                <span>Export to Bricklink XML</span>
                <span className="text-gray-500 text-sm">
                  Use this to populate your Bricklink inventory or a wanted
                  parts list
                </span>
              </div>
              <div className="flex justify-end items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleExportDownload}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleExportCopy}
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </>
        )}

        {!loading &&
          !error &&
          parts.length === 0 &&
          currentSetNumber === "" && (
            <div className="text-center py-12 text-gray-600">
              <ol className="inline-block text-left space-y-2">
                <li>1. Enter a LEGO set number above</li>
                <li>2. Check off the pieces you've got</li>
                <li>3. Build it</li>
              </ol>
            </div>
          )}

        {/* Footer */}
        <footer className="mt-12 pt-8 pb-4 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>
            Built by{" "}
            <a
              href="https://www.tomtaylor.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Tom Taylor
            </a>
          </p>
          <p>
            Rebuilt by{" "}
            <a
              href="https://alyssajenkinson.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Alyssa Jenkinson
            </a>
          </p>
          <p className="mt-2">
            LEGO data provided by the{" "}
            <a
              href="https://rebrickable.com/api/v3/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Rebrickable API
            </a>
            ,{" "}
            <a
              href="https://github.com/tomtaylor/lego-checklist"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              source code available on GitHub
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
