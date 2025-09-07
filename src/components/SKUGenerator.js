import React, { useState, useEffect, useRef } from "react";

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
  }, []);

  useEffect(() => {
    if (editingSKU && columnInputRef.current) {
      columnInputRef.current.focus();
    }
  }, [editingSKU]);

  useEffect(() => {
    fetchSKUs();
    fetchLocations();
    const interval = setInterval(() => {
      setClock(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (skusListRef.current) {
      skusListRef.current.scrollTop = skusListRef.current.scrollHeight;
    }
  }, [skusList]);

  useEffect(() => {
    console.log("Updated State - Column:", tempColumn, "Row:", tempRow);
  }, [editingSKU, tempColumn, tempRow]);

  useEffect(() => {
    if (editingSKU) {
      setTempColumn(tempColumnRef.current);
      setTempRow(tempRowRef.current);
    }
  }, [editingSKU]);

  useEffect(() => {
    if (!modifiedSKUId) {
      setEditedSku("");
    }
  }, [modifiedSKUId]);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/getLocations`);
      const data = await response.json();
      setHorizontalLocations(data.horizontal);
      setVerticalIncrements(data.vertical);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const addHorizontalLocation = async () => {
    if (!newHorizontalLocation.trim() || horizontalLocations.includes(newHorizontalLocation.toUpperCase())) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/addLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "horizontal", value: newHorizontalLocation.toUpperCase() }),
      });

      if (!response.ok) {
        throw new Error("Failed to save location");
      }

      setHorizontalLocations([...horizontalLocations, newHorizontalLocation.toUpperCase()]);
      setNewHorizontalLocation("");
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const addVerticalIncrement = async () => {
    if (!newVerticalIncrement.trim() || verticalIncrements.includes(newVerticalIncrement)) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/addLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vertical", value: newVerticalIncrement }),
      });

      if (!response.ok) {
        throw new Error("Failed to save location");
      }

      setVerticalIncrements([...verticalIncrements, newVerticalIncrement]);
      setNewVerticalIncrement("");
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const removeSelectedHorizontalLocation = async () => {
    if (!column) {
      alert("Please select a horizontal location to remove.");
      return;
    }

    const isLocationInUse = skusList.some((sku) => sku.column === column);
    if (isLocationInUse) {
      alert("Cannot remove this location because it is in use by existing SKUs.");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/removeLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "horizontal", value: column }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove location");
      }

      setHorizontalLocations(horizontalLocations.filter((loc) => loc !== column));
      setColumn("");
      alert("Horizontal location removed successfully!");
    } catch (error) {
      console.error("Error removing location:", error);
      alert("Failed to remove location. Please try again.");
    }
  };

  const removeSelectedVerticalIncrement = async () => {
    if (!row) {
      alert("Please select a vertical increment to remove.");
      return;
    }

    const isIncrementInUse = skusList.some((sku) => sku.row === row);
    if (isIncrementInUse) {
      alert("Cannot remove this increment because it is in use by existing SKUs.");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/removeLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vertical", value: row }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove increment");
      }

      setVerticalIncrements(verticalIncrements.filter((inc) => inc !== row));
      setRow("");
      alert("Vertical increment removed successfully!");
    } catch (error) {
      console.error("Error removing increment:", error);
      alert("Failed to remove increment. Please try again.");
    }
  };

  const getCurrentMMYY = () => {
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}${year}`;
  };

  const generateSKU = () => {
    if (!category) {
      alert("Please fill in the required field: Category.");
      return;
    }
    if ((column && !row) || (!column && row)) {
      setLocationError(true);
      alert("Please complete both Column and Row, or leave both empty.");
      return;
    } else {
      setLocationError(false);
    }

    const newSerialNumber = (lastSerialNumber + 1).toString().padStart(4, '0');
    const currentMMYY = getCurrentMMYY();
    const formattedSKU = `${column}${row}-${newSerialNumber}-${currentMMYY}-${category.toUpperCase()}`;
    setSku(formattedSKU);
    setLastSerialNumber(lastSerialNumber + 1);
    setModifiedSKUId(null);
    setIsSaved(false);
  };

  const saveSKU = async () => {
    if (!sku) return;

    try {
      const checkResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/checkSKU?sku=${sku}`);
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

    const skuData = { column, row, category, subcategory, cost, price, sku, description, date: new Date(), dateCode };

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/saveSKU`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skuData)
      });

      const data = await response.json();
      if (data.message === "SKU saved successfully") {
        alert("✅ SKU saved successfully!");
        fetchSKUs();
        setIsSaved(true);
        setColumn("");
        setRow("");
        setCategory("");
        setSubcategory("");
        setCost("");
        setPrice("");
        setDescription("");
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/getSKUs`);
      if (!response.ok) {
        throw new Error("Failed to fetch SKUs");
      }
      const data = await response.json();

      if (data.error) {
        console.error("Backend error:", data.message);
        setSkusList([]);
        return;
      }

      if (Array.isArray(data)) {
        setSkusList(data);

        const uniqueCategories = [...new Set(data.map((item) => item.category))].filter(Boolean);
        const uniqueSubcategories = [...new Set(data.map((item) => item.subcategory))].filter(Boolean);

        setCategorySuggestions(uniqueCategories);
        setSubcategorySuggestions(uniqueSubcategories);

        const lastSKU = data[data.length - 1];
        if (lastSKU) {
          const parts = lastSKU.sku.split('-');
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
  const copyToClipboard = async () => {
    const textToCopy = editedSku || sku;

    if (!textToCopy) {
      alert("No SKU available to copy.");
      return;
    }

    if (!isSaved) {
      const shouldSave = window.confirm("SKU not saved yet. Do you want to save and copy?");
      if (!shouldSave) return;

      try {
        await saveSKU();

        // Use updated SKU after saving
        const latestText = editedSku || sku;

        if (latestText) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(latestText);
            alert("✅ SKU saved and copied to clipboard.");
          } else {
            fallbackCopyToClipboard(latestText);
            alert("✅ SKU saved and copied to clipboard.");
          }
        } else {
          alert("✅ SKU saved, but copy failed due to missing value.");
        }
      } catch (error) {
        console.error('Error during save and copy:', error);
      }
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(textToCopy);
      alert(`Copied to clipboard: ${textToCopy}`);
    } else {
      fallbackCopyToClipboard(textToCopy);
    }
  };

  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert(`Copied to clipboard: ${text}`);
      } else {
        console.error('Fallback copy failed');
      }
    } catch (err) {
      console.error('Fallback copy failed: ', err);
    }

    document.body.removeChild(textArea);
  };

  const saveLocationChange = async (skuId) => {
    const normalizedTempColumn = tempColumn.toUpperCase();
    const normalizedTempRow = tempRow.toUpperCase();

    if (
      !horizontalLocations.map((loc) => loc.toUpperCase()).includes(normalizedTempColumn) ||
      !verticalIncrements.map((inc) => inc.toUpperCase()).includes(normalizedTempRow)
    ) {
      setError("Invalid Location! Please enter a valid Column and Row.");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/updateSKU/${skuId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          column: normalizedTempColumn,
          row: normalizedTempRow,
          description: tempDescription,
        }),
      });

      if (response.ok) {
        alert("Changes saved successfully!");
        setEditingSKU(null);
        setError("");
        setModifiedSKUId(skuId);
        await fetchSKUs();
        const updatedSKU = await response.json();
        setEditedSku(updatedSKU.sku);
      } else {
        alert("Failed to save changes. Please try again.");
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert("Failed to save changes. Please try again.");
    }
  };

  const toggleEdit = (sku) => {
    if (editingSKU === sku._id) {
      setEditingSKU(null);
    } else {
      setEditingSKU(sku._id);
      setTempColumn(sku.column);
      setTempRow(sku.row);
      setTempDescription(sku.description || "");
      setModifiedSKUId(null);
    }
  };

  return (
    <React.Fragment>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: isOnline ? "green" : "red",
            display: "inline-block",
          }}
        ></span>
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "row", padding: "20px" }}>
        <div
          ref={skusListRef}
          key={skusList.length}
          style={{ 
            width: "30%", 
            borderRight: "1px solid gray", 
            padding: "10px", 
            overflowY: "scroll", 
            maxHeight: "500px", 
            backgroundColor: "#f9f9f9" 
          }}
        >
          <h2>SKU List</h2>
          {Array.isArray(skusList) && skusList.map((item, index) => (
            <div
              key={index}
              style={{
                padding: "5px",
                borderBottom: "1px solid lightgray",
                cursor: "pointer",
                color: modifiedSKUId === item._id ? "red" : "blue"
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

        <div style={{ width: "70%", padding: "20px", textAlign: "center", backgroundColor: "#fff" }}>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: "#444" }}>
            {clock.toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <h1 style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold", marginTop: "5px" }}>
            Open Box SKU Generator
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            <div>
              <h3>Horizontal Locations</h3>
              <select
                value={column}
                onChange={(e) => setColumn(e.target.value)}
                style={{
                  borderColor: locationError && (!column || !row) ? 'red' : '#ccc',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <option value="">Select Horizontal Location</option>
                {horizontalLocations.map((loc, index) => (
                  <option key={index} value={loc}>{loc}</option>
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
                style={{
                  backgroundColor: "red",
                  color: "white",
                  marginTop: "10px",
                  width: "20%",
                  padding: "5px"
                }}
              >
                Del
              </button>
            </div>

            <div>
              <h3>Vertical Increments</h3>
              <select
                value={row}
                onChange={(e) => setRow(e.target.value)}
                style={{
                  borderColor: locationError && (!column || !row) ? 'red' : '#ccc',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <option value="">Select Vertical Increment</option>
                {verticalIncrements.map((num, index) => (
                  <option key={index} value={num}>{num}</option>
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
                style={{
                  backgroundColor: "red",
                  color: "white",
                  marginTop: "10px",
                  width: "20%",
                  padding: "5px"
                }}
              >
                Del
              </button>
            </div>

            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="category-suggestions"
              placeholder="Enter Category"
            />
            <datalist id="category-suggestions">
              {categorySuggestions.map((c, index) => (
                <option key={index} value={c} />
              ))}
            </datalist>

            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              list="subcategory-suggestions"
              placeholder="Enter Subcategory"
            />
            <datalist id="subcategory-suggestions">
              {subcategorySuggestions.map((s, index) => (
                <option key={index} value={s} />
              ))}
            </datalist>

            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Cost (Optional)"
            />
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Sale Price (Optional)"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Description (Optional)"
              rows="3"
              maxLength="500"
            />

            <button 
              onClick={generateSKU} 
              style={{ backgroundColor: "green", color: "white" }}
            >
              Generate SKU
            </button>

            {(sku || editedSku) && (
              <p>
                <strong>Generated/Edited SKU:</strong> {sku || editedSku}
              </p>
            )}

            <button onClick={copyToClipboard}>Copy SKU</button>
            <button 
              onClick={saveSKU} 
              style={{ backgroundColor: "blue", color: "white" }}
            >
              Save SKU
            </button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SKUGenerator;