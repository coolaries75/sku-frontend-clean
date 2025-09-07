import React, { useState, useEffect } from "react";
import axios from "axios";

// Clipboard functions
const copyToClipboard = (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => alert(`Copied to clipboard: ${text}`))
      .catch(() => fallbackCopyToClipboard(text));
  } else {
    fallbackCopyToClipboard(text);
  }
};

const fallbackCopyToClipboard = (text) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
    alert(`Copied to clipboard: ${text}`);
  } catch (err) {
    alert('Failed to copy');
  }
  document.body.removeChild(textarea);
};

const SkuSearchPanel = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingValues, setEditingValues] = useState({ 
    row: '', 
    column: '', 
    description: '' 
  });
  const [horizontalLocations, setHorizontalLocations] = useState([]);
  const [verticalLocations, setVerticalLocations] = useState([]);
  
  // A4 Feature states
  const [lastAssignedSkus, setLastAssignedSkus] = useState([]);
  const [showTracker, setShowTracker] = useState(false);
  const [highlightedSkus, setHighlightedSkus] = useState([]);
  const [hasNewAssignments, setHasNewAssignments] = useState(false);
  const [showAllSkus, setShowAllSkus] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin.replace(":3000", ":4000");

  // Fetch SKUs from backend
  const fetchSkus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/getSKUs`, {
        headers: { 'Accept': 'application/json' }
      });
      setSkus(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching SKUs:", err);
      setError(`Failed to load SKUs: ${err.message}`);
      setSkus([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch location options
  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/getLocations`);
      if (response.data) {
        setHorizontalLocations(response.data.horizontal || []);
        setVerticalLocations(response.data.vertical || []);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchSkus();
    fetchLocations();
  }, []);

  // Toggle edit mode for SKU
  const handleEditToggle = (id) => {
    if (editingId === id) {
      setEditingId(null);
    } else {
      const skuToEdit = skus.find(sku => sku._id === id);
      if (skuToEdit) {
        setEditingValues({
          row: skuToEdit.row || '',
          column: skuToEdit.column || '',
          description: skuToEdit.description || ''
        });
        setEditingId(id);
      }
    }
  };

  // Handle form field changes
  const handleChange = (field, value) => {
    setEditingValues(prev => ({ ...prev, [field]: value }));
  };

  // Save SKU changes with A4 features
  const handleSave = async (id) => {
    try {
      const skuToUpdate = skus.find(sku => sku._id === id);
      if (!skuToUpdate) return;

      // A4.4: Validate both fields are filled or both empty
      if ((editingValues.row && !editingValues.column) || (!editingValues.row && editingValues.column)) {
        alert("Both row and column must be filled to assign a location.");
        return;
      }

      const wasUnassigned = !skuToUpdate.row && !skuToUpdate.column;
      const nowAssigned = editingValues.row && editingValues.column;

      const payload = {
        column: editingValues.column,
        row: editingValues.row,
        description: editingValues.description,
        status: skuToUpdate.status || "Active"
      };

      const response = await axios.put(`${BACKEND_URL}/api/updateSKU/${id}`, payload);
      const updatedSku = response.data;

      // A4.7: Final Fix - Check actual saved data to determine if assignment happened
      const isActuallyAssigned = updatedSku.row && updatedSku.column;

      // A4.2: Track newly assigned SKUs only if actually assigned
      if (wasUnassigned && isActuallyAssigned) {
        const newlyAssignedSku = {
          sku: skuToUpdate.sku,
          dateAssigned: new Date().toLocaleTimeString(),
          id: skuToUpdate._id
        };

        setLastAssignedSkus(prev => [newlyAssignedSku, ...prev.slice(0, 9)]);
        
        // A4.1: Permanent highlight with timestamp
        setHighlightedSkus(prev => [...prev, { id: skuToUpdate._id, time: Date.now() }]);
        
        // A4.5: New assignment notification
        if (!showTracker) setHasNewAssignments(true);
      }

      setEditingId(null);
      await fetchSkus(); // Refresh the list with actual backend data
    } catch (error) {
      console.error("Error updating SKU:", error);
      setError(`Failed to update SKU: ${error.message}`);
    }
  };

  // A4.1: Toggle tracker panel
  const toggleTracker = () => {
    setShowTracker(!showTracker);
    setHasNewAssignments(false);
  };

  // Get assignment order for sorting
  const getAssignmentOrder = (sku) => {
    const entry = highlightedSkus.find(item => item.id === sku._id);
    return entry ? entry.time : null;
  };

  // Filter and sort SKUs based on search query and view mode
  const filteredSkus = skus
    .filter(sku => {
      const searchLower = searchQuery.toLowerCase();
      return (
        sku.sku?.toLowerCase().includes(searchLower) ||
        sku.description?.toLowerCase().includes(searchLower)
      );
    })
    .filter(sku => {
      const isAssigned = sku.row && sku.column;
      return showAllSkus || !isAssigned;
    })
    .sort((a, b) => {
      const orderA = getAssignmentOrder(a);
      const orderB = getAssignmentOrder(b);

      if (orderA !== null && orderB !== null) return orderB - orderA;
      if (orderA !== null) return -1;
      if (orderB !== null) return 1;
      return 0;
    });

  if (loading) {
    return <div style={{ padding: "1rem", textAlign: "center" }}>Loading SKUs...</div>;
  }

  if (error) {
    return <div style={{ padding: "1rem", color: "red", textAlign: "center" }}>{error}</div>;
  }

  return (
    <div style={{ padding: "1rem", position: "relative" }}>
      {/* Search Input and View Toggle */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search SKU or description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            width: "100%", 
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            marginBottom: "0.5rem"
          }}
        />
        <button
          onClick={() => setShowAllSkus(!showAllSkus)}
          style={{
            padding: "0.5rem",
            background: showAllSkus ? "#4CAF50" : "#f0f0f0",
            color: showAllSkus ? "white" : "inherit",
            border: "none",
            borderRadius: "4px"
          }}
        >
          {showAllSkus ? "Show All" : "Unassigned Only"}
        </button>
      </div>

      {/* SKU List */}
      {filteredSkus.map(sku => {
        const isEditing = editingId === sku._id;
        const isHighlighted = highlightedSkus.some(item => item.id === sku._id);
        const currentValues = isEditing ? editingValues : sku;
        const isAssigned = sku.row && sku.column;

        return (
          <div key={sku._id} style={{
            margin: "1rem 0",
            padding: "1rem",
            border: isHighlighted ? "2px solid #4CAF50" : "1px solid #ddd",
            backgroundColor: isHighlighted ? "#f0fff4" : isAssigned ? "#f9f9f9" : "#fff",
            borderRadius: "4px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{sku.sku}</strong>
              <div style={{ display: "flex", alignItems: "center" }}>
                {isHighlighted && (
                  <span style={{
                    background: "#4CAF50",
                    color: "white",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    marginRight: "8px"
                  }}>
                    Assigned
                  </span>
                )}
                {!isEditing && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(sku.sku);
                    }}
                    style={{
                      fontSize: "12px",
                      padding: "3px 6px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      backgroundColor: "#f0f0f0",
                      cursor: "pointer"
                    }}
                  >
                    📋 Copy
                  </button>
                )}
              </div>
            </div>
            <div>{sku.description}</div>

            {isEditing ? (
              <>
                {!isAssigned && (
                  <div style={{ display: "flex", gap: "0.5rem", margin: "0.5rem 0" }}>
                    <select
                      value={currentValues.column}
                      onChange={(e) => handleChange("column", e.target.value)}
                      style={{ flex: 1, padding: "0.5rem" }}
                    >
                      <option value="">Select Column</option>
                      {horizontalLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <select
                      value={currentValues.row}
                      onChange={(e) => handleChange("row", e.target.value)}
                      style={{ flex: 1, padding: "0.5rem" }}
                    >
                      <option value="">Select Row</option>
                      {verticalLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                )}
                <textarea
                  value={currentValues.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  style={{ 
                    width: "100%", 
                    padding: "0.5rem", 
                    marginBottom: "0.5rem",
                    minHeight: "80px"
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ 
                      flex: 1, 
                      padding: "0.5rem", 
                      background: "#f0f0f0"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(sku._id)}
                    style={{ 
                      flex: 1, 
                      padding: "0.5rem", 
                      background: "#4CAF50", 
                      color: "white"
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div style={{ marginTop: "0.5rem" }}>
                {isAssigned ? (
                  <>
                    <div>Location: {sku.row}, {sku.column}</div>
                    <button
                      onClick={() => handleEditToggle(sku._id)}
                      style={{ 
                        marginTop: "0.5rem",
                        padding: "0.5rem", 
                        background: "#f0f0f0"
                      }}
                    >
                      Edit Description
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEditToggle(sku._id)}
                    style={{ 
                      padding: "0.5rem", 
                      background: "#f0f0f0"
                    }}
                  >
                    Assign Location
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* A4.1: Assignment Tracker Panel */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        width: '260px'
      }}>
        <button
          onClick={toggleTracker}
          style={{
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '1.5rem',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          📦
          {hasNewAssignments && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: 'red',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.8rem'
            }}>
              !
            </span>
          )}
        </button>

        {showTracker && (
          <div style={{
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginTop: '10px',
            padding: '1rem',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <h4>Last 10 Assigned SKUs</h4>
            {lastAssignedSkus.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {lastAssignedSkus.map((item, idx) => (
                  <li key={idx} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                    <strong>{item.sku}</strong>
                    <div>{item.dateAssigned}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent assignments</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkuSearchPanel;