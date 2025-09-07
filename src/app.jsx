import React, { useState } from "react";
import SKUGenerator from "./components/SKUGenerator";
import SkuSearchPanel from "./components/SkuSearchPanel";

const App = () => {
  const [activeTab, setActiveTab] = useState("generator");
  const [authenticated, setAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState("");

  const correctPassword = "gio2025"; // 🔐 Set your password here

  if (!authenticated) {
    return (
      <div style={{ textAlign: "center", paddingTop: "100px" }}>
        <h2>🔐 Enter Access Password</h2>
        <input
          type="password"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
          placeholder="Password"
          style={{ padding: "10px", fontSize: "16px", width: "200px" }}
        />
        <br /><br />
        <button
          onClick={() => {
            if (inputPassword === correctPassword) {
              setAuthenticated(true);
            } else {
              alert("Incorrect password.");
            }
          }}
        >
          Enter
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-center space-x-4 my-4">
        <button
          onClick={() => setActiveTab("generator")}
          style={{
            backgroundColor: activeTab === "generator" ? "#1f2937" : "#e5e7eb",
            color: activeTab === "generator" ? "white" : "black",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem",
            border: "none",
          }}
        >
          Generate SKU
        </button>
        <button
          onClick={() => setActiveTab("search")}
          style={{
            backgroundColor: activeTab === "search" ? "#1f2937" : "#e5e7eb",
            color: activeTab === "search" ? "white" : "black",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem",
            border: "none",
          }}
        >
          Find & Assign SKU
        </button>
      </div>

      {activeTab === "generator" && <SKUGenerator />}
      {activeTab === "search" && <SkuSearchPanel />}
    </div>
  );
};

export default App;
