import React, { useState, useEffect, useRef } from "react";
import StickyActions from "./StickyActions";

const SKUGenerator = () => {
  const [isOnline, setIsOnline] = useState(true);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

  const [column, setColumn] = useState("");
  const [row, setRow] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [lastSerialNumber, setLastSerialNumber] = useState(0);
  const [sku, setSku] = useState("");
  const [editedSku, setEditedSku] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [skusList, setSkusList] = useState([]);
  const [horizontalLocations, setHorizontalLocations] = useState([]);
  const [verticalIncrements, setVerticalIncrements] = useState([]);
  const [newHorizontalLocation, setNewHorizontalLocation] = useState("");
  const [newVerticalIncrement, setNewVerticalIncrement] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [subcategorySuggestions, setSubcategorySuggestions] = useState([]);
  const [clock, setClock] = useState(new Date());
  const [locationError, setLocationError] = useState(false);

  const skusListRef = useRef(null);
  const tempColumnRef = useRef("");
  const tempRowRef = useRef("");

  const [editingSKU, setEditingSKU] = useState(null);
  const [tempColumn, setTempColumn] = useState("");
  const [tempRow, setTempRow] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [error, setError] = useState("");
  const [modifiedSKUId, setModifiedSKUId] = useState(null);
  const dateCode = new Date().toISOString().slice(2, 7).replace("-", "");
  const columnInputRef = useRef(null);

  // Online check
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${backendUrl}/health`);
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 5000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  // Focus edit
  useEffect(() => {
    if (editingSKU && columnInputRef.current) columnInputRef.current.focus();
  }, [editingSKU]);

  // Initial loads + clock
  useEffect(() => {
    fetchSKUs();
    fetchLocations();
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Scroll list to bottom when SKUs update
  useEffect(() => {
    if (skusListRef.current) skusListRef.current.scrollTop = skusListRef.current.scrollHeight;
  }, [skusList]);

  // Seed temp values when edit opens
  useEffect(() => {
    if (editingSKU) {
      setTempColumn(tempColumnRef.current);
      setTempRow(tempRowRef.current);
    }
  }, [editingSKU]);

  // Clear editedSku marker when modified id resets
  useEffect(() => {
    if (!modifiedSKUId) setEditedSku("");
  }, [modifiedSKUId]);

  // --- API helpers ----------------------------------------------------------

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/getLocations`);
      const data = await response.json();
      setHorizontalLocations(data.horizontal || []);
      setVerticalIncrements(data.vertical || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const addHorizontalLocation = async () => {
    if (!newHorizontalLocation.trim() || horizontalLocations.includes(newHorizontalLocation.toUpperCase())) return;
    try {
      const response = await fetch(`${backendUrl}/api/addLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "horizontal", value: newHorizontalLocation.toUpperCase() }),
      });
      if (!response.ok) throw new Error("Failed to save location");
      setHorizontalLocations([...horizontalLocations, newHorizontalLocation.toUpperCase()]);
      setNewHorizontalLocation("");
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const addVerticalIncrement = async () => {
    if (!newVerticalIncrement.trim() || verticalIncrements.includes(newVerticalIncrement)) return;
    try {
      const response = await fetch(`${backendUrl}/api/addLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vertical", value: newVerticalIncrement }),
      });
      if (!response.ok) throw new Error("Failed to save location");
      setVerticalIncrements([...verticalIncrements, newVerticalIncrement]);
      setNewVerticalIncrement("");
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const removeSelectedHorizontalLocation = async () => {
    if (!column) return alert("Please select a horizontal location to remove.");
    const isLocationInUse = skusList.some((s) => s.column === column);
    if (isLocationInUse) return alert("Cannot remove this location because it is in use by existing SKUs.");
    try {
      const response = await fetch(`${backendUrl}/api/removeLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "horizontal", value: column }),
      });
      if (!response.ok) throw new Error("Failed to remove location");
      setHorizontalLocations(horizontalLocations.filter((loc) => loc !== column));
      setColumn("");
      alert("Horizontal location removed successfully!");
    } catch (error) {
      console.error("Error removing location:", error);
      alert("Failed to remove location. Please try again.");
    }
  };

  const removeSelectedVerticalIncrement = async () => {
    if (!row) return alert("Please select a vertical increment to remove.");
    const isIncrementInUse = skusList.some((s) => s.row === row);
    if (isIncrementInUse) return alert("Cannot remove this increment because it is in use by existing SKUs.");
    try {
      const response = await fetch(`${backendUrl}/api/removeLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vertical", value: row }),
      });
      if (!response.ok) throw new Error("Failed to remove increment");
      setVerticalIncrements(verticalIncrements.filter((inc) => inc !== row));
      setRow("");
      alert("Vertical increment removed successfully!");
    } catch (error) {
      console.error("Error removing increment:", error);
      alert("Failed to remove increment. Please try again.");
    }
  };

  // --- SKU operations -------------------------------------------------------

  const getCurrentMMYY = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}${yy}`;
  };

  const generateSKU = () => {
    if (!category) return alert("Please fill in the required field: Category.");
    if ((column && !row) || (!column && row)) {
      setLocationError(true);
      return alert("Please complete both Column and Row, or leave both empty.");
    } else {
      setLocationError(false);
    }
    const serial = String(lastSerialNumber + 1).padStart(4, "0");
    const mmyy = getCurrentMMYY();
    const formatted = `${column}${row}-${serial}-${mmyy}-${category.toUpperCase()}`;
    setSku(formatted);
    setLastSerialNumber(lastSerialNumber + 1);
    setModifiedSKUId(null);
    setIsSaved(false);
  };

  const saveSKU = async () => {
    if (!sku) return;
    try {
      const checkResponse = await fetch(`${backendUrl}/api/checkSKU?sku=${encodeURIComponent(sku)}`);
      const checkData = await checkResponse.json();
      if (checkData.exists) {
        alert("❌ Duplicate SKU detected. Please regenerate the SKU.");
        fetchSKUs();
        setSku("");
        setIsSaved(false);
        return;
      }
    } catch (error) {
      console.error("Error checking SKU:", error);
      alert("❌ Error checking SKU. Please try again.");
      setIsSaved(false);
      return;
    }

    const payload = { column, row, category, subcategory, cost, price, sku, description, date: new Date(), dateCode };
    try {
      const response = await fetch(`${backendUrl}/api/saveSKU`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.message === "SKU saved successfully") {
        alert("✅ SKU saved successfully!");
        fetchSKUs();
        setIsSaved(true);
        setColumn(""); setRow(""); setCategory(""); setSubcategory("");
        setCost(""); setPrice(""); setDescription("");
        setModifiedSKUId(null);
      } else {
        alert("❌ Failed to save SKU. Please try again.");
        setIsSaved(false);
      }
    } catch (error) {
      console.error("Error saving SKU:", error);
      alert("❌ Error saving SKU. Please try again.");
      setIsSaved(false);
    }
  };

  const fetchSKUs = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/getSKUs`);
      if (!response.ok) throw new Error("Failed to fetch SKUs");
      const data = await response.json();

      if (data.error) {
        console.error("Backend error:", data.message);
        setSkusList([]);
        return;
      }

      if (Array.isArray(data)) {
        setSkusList(data);

        const uniqueCategories = [...new Set(data.map((i) => i.category))].filter(Boolean);
        const uniqueSubcategories = [...new Set(data.map((i) => i.subcategory))].filter(Boolean);
        setCategorySuggestions(uniqueCategories);
        setSubcategorySuggestions(uniqueSubcategories);

        const lastSKU = data[data.length - 1];
        if (lastSKU) {
          const parts = lastSKU.sku.split("-");
          setLastSerialNumber(parseInt(parts[1], 10));
        } else {
          setLastSerialNumber(0);
        }
      } else {
        console.error("Expected an array but got:", data);
        setSkusList([]);
      }
    } catch (error) {
      console.error("Error fetching SKUs:", error);
      setSkusList([]);
    }
  };

  const fallbackCopyToClipboard = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "0"; ta.style.left = "0";
    ta.style.width = "2em"; ta.style.height = "2em";
    ta.style.padding = "0"; ta.style.border = "none";
    ta.style.outline = "none"; ta.style.boxShadow = "none";
    ta.style.background = "transparent";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try {
      const ok = document.execCommand("copy");
      if (ok) alert(`Copied to clipboard: ${text}`);
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
    document.body.removeChild(ta);
  };

  const copyToClipboard = async () => {
    const textToCopy = editedSku || sku;
    if (!textToCopy) return alert("No SKU available to copy.");

    if (!isSaved) {
      const shouldSave = window.confirm("SKU not saved yet. Do you want to save and copy?");
      if (!shouldSave) return;
      try {
        await saveSKU();
        const latest = editedSku || sku;
        if (latest) {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(latest);
          } else {
            fallbackCopyToClipboard(latest);
          }
          alert("✅ SKU saved and copied to clipboard.");
        } else {
          alert("✅ SKU saved, but copy failed due to missing value.");
        }
      } catch (e) {
        console.error("Error during save and copy:", e);
      }
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(textToCopy);
      alert(`Copied to clipboard: ${textToCopy}`);
    } else {
      fallbackCopyToClipboard(textToCopy);
    }
  };

  const saveLocationChange = async (skuId) => {
    const normalizedColumn = tempColumn.toUpperCase();
    const normalizedRow = tempRow.toUpperCase();
    if (
      !horizontalLocations.map((x) => x.toUpperCase()).includes(normalizedColumn) ||
      !verticalIncrements.map((x) => x.toUpperCase()).includes(normalizedRow)
    ) {
      setError("Invalid Location! Please enter a valid Column and Row.");
      return;
    }
    try {
      const response = await fetch(`${backendUrl}/api/updateSKU/${skuId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column: normalizedColumn, row: normalizedRow, description: tempDescription }),
      });
      if (response.ok) {
        alert("Changes saved successfully!");
        setEditingSKU(null);
        setError("");
        setModifiedSKUId(skuId);
        await fetchSKUs();
        const updated = await response.json();
        setEditedSku(updated.sku);
      } else {
        alert("Failed to save changes. Please try again.");
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  const toggleEdit = (s) => {
    if (editingSKU === s._id) {
      setEditingSKU(null);
    } else {
      setEditingSKU(s._id);
      setTempColumn(s.column);
      setTempRow(s.row);
      setTempDescription(s.description || "");
      setModifiedSKUId(null);
    }
  };

  // --- UI -------------------------------------------------------------------

  return (
    <React.Fragment>
      {/* Status pill */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: isOnline ? "green" : "red",
            display: "inline-block",
          }}
        />
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Responsive page layout */}
      <div className="sku-layout">
        {/* LEFT — list */}
        <div ref={skusListRef} key={skusList.length} className="sku-list">
          <h2>SKU List</h2>
          {Array.isArray(skusList) &&
            skusList.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "5px",
                  borderBottom: "1px solid lightgray",
                  cursor: "pointer",
                  color: modifiedSKUId === item._id ? "red" : "blue",
                }}
              >
                <div onClick={() => toggleEdit(item)}>
                  {item.sku} {item.description && "📝"}
                </div>

                {editingSKU === item._id && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <label>
                      Column:
                      <input
                        type="text"
                        value={tempColumn}
                        onChange={(e) => setTempColumn(e.target.value)}
                        placeholder="Enter Column"
                        ref={columnInputRef}
                      />
                    </label>
                    <br />
                    <label>
                      Row:
                      <input
                        type="text"
                        value={tempRow}
                        onChange={(e) => setTempRow(e.target.value)}
                        placeholder="Enter Row"
                      />
                    </label>
                    <br />
                    <label>
                      Description:
                      <textarea
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        placeholder="Enter Description"
                        rows="3"
                        maxLength="500"
                      />
                    </label>
                    <br />
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    <button onClick={(e) => { e.stopPropagation(); saveLocationChange(item._id); }}>
                      Save Changes
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingSKU(null); }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* RIGHT — form */}
        <div className="sku-form">
          <div style={{ fontSize: "14px", fontWeight: "bold", color: "#444" }}>
            {clock.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <h1 style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold", marginTop: "5px" }}>
            Open Box SKU Generator
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            {/* Horizontal */}
            <div>
              <h3>Horizontal Locations</h3>
              <select
                value={column}
                onChange={(e) => setColumn(e.target.value)}
                style={{
                  borderColor: locationError && (!column || !row) ? "red" : "#ccc",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <option value="">Select Horizontal Location</option>
                {horizontalLocations.map((loc, i) => (
                  <option key={i} value={loc}>{loc}</option>
                ))}
              </select>

              <input
                type="text"
                value={newHorizontalLocation}
                onChange={(e) => setNewHorizontalLocation(e.target.value)}
                placeholder="New Horizontal"
              />
              <button onClick={addHorizontalLocation}>Add</button>
              <button
                onClick={removeSelectedHorizontalLocation}
                style={{ backgroundColor: "red", color: "white", marginTop: "10px", width: "20%", padding: "5px" }}
              >
                Del
              </button>
            </div>

            {/* Vertical */}
            <div>
              <h3>Vertical Increments</h3>
              <select
                value={row}
                onChange={(e) => setRow(e.target.value)}
                style={{
                  borderColor: locationError && (!column || !row) ? "red" : "#ccc",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <option value="">Select Vertical Increment</option>
                {verticalIncrements.map((num, i) => (
                  <option key={i} value={num}>{num}</option>
                ))}
              </select>

              <input
                type="text"
                value={newVerticalIncrement}
                onChange={(e) => setNewVerticalIncrement(e.target.value)}
                placeholder="New Vertical"
              />
              <button onClick={addVerticalIncrement}>Add</button>
              <button
                onClick={removeSelectedVerticalIncrement}
                style={{ backgroundColor: "red", color: "white", marginTop: "10px", width: "20%", padding: "5px" }}
              >
                Del
              </button>
            </div>

            {/* Category/Subcategory */}
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="category-suggestions"
              placeholder="Enter Category"
            />
            <datalist id="category-suggestions">
              {categorySuggestions.map((c, i) => (<option key={i} value={c} />))}
            </datalist>

            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              list="subcategory-suggestions"
              placeholder="Enter Subcategory"
            />
            <datalist id="subcategory-suggestions">
              {subcategorySuggestions.map((s, i) => (<option key={i} value={s} />))}
            </datalist>

            {/* Prices */}
            <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Cost (Optional)" />
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Sale Price (Optional)" />

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Description (Optional)"
              rows="3"
              maxLength="500"
            />

            {/* Desktop inline actions */}
            <button className="desktop-only" onClick={generateSKU} style={{ backgroundColor: "green", color: "white" }}>
              Generate SKU
            </button>

            {(sku || editedSku) && (
              <p><strong>Generated/Edited SKU:</strong> {sku || editedSku}</p>
            )}

            <button className="desktop-only" onClick={copyToClipboard}>Copy SKU</button>
            <button className="desktop-only" onClick={saveSKU} style={{ backgroundColor: "blue", color: "white" }}>
              Save SKU
            </button>
          </div>

          {/* Sticky Actions: Mobile only */}
          <StickyActions className="mobile-only">
            <button className="btn" onClick={generateSKU} style={{ backgroundColor: "green", color: "white" }}>
              Generate SKU
            </button>
            <button className="btn" onClick={saveSKU} style={{ backgroundColor: "blue", color: "white" }}>
              Save SKU
            </button>
            <button className="btn" onClick={copyToClipboard}>
              Copy SKU
            </button>
          </StickyActions>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SKUGenerator;
