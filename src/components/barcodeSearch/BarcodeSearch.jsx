import { useState, useRef } from "react";
import {
  ScanBarcode,
  X,
  Hash,
  FileCode,
  Building2,
} from "lucide-react";

import "./BarcodeSearch.css";

export default function BarcodeSearch({
  products,
  onSelect,
  placeholder = "Barcode yoki nom kiriting..."
}) {
  const [value, setValue] = useState("");
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef();

  const search = (text) => {
    setValue(text);

    if (!text.trim()) {
      setResults([]);
      return;
    }

    const q = text.toLowerCase();

    setResults(
      products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.barcodes.some((b) => b.barcode.includes(text)) ||
            (p.ikpuCode || "").includes(text)
        )
        .slice(0, 6)
    );
  };

  const handleSelect = (product) => {
    setValue("");
    setResults([]);

    inputRef.current?.blur();

    onSelect(product);
  };

  return (
    <div className="barcode-search">

      <div
        className={`barcode-search-inner ${
          focused ? "barcode-search-focus" : ""
        }`}
      >
        <ScanBarcode
          size={16}
          strokeWidth={2}
          className="barcode-search-icon"
        />

        <input
          ref={inputRef}
          className="barcode-search-input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => search(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />

        {value && (
          <button
            className="barcode-search-clear"
            onClick={() => {
              setValue("");
              setResults([]);
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="barcode-search-dropdown">
          {results.map((product) => {
            const primary = product.barcodes.find(
              (b) => b.isPrimary
            );

            return (
              <button
                key={product.id}
                className="barcode-search-item"
                onClick={() => handleSelect(product)}
              >
                <div className="barcode-search-name">
                  {product.name}
                </div>

                <div className="barcode-search-meta">

                  {primary && (
                    <span className="p-bc-badge">
                      <Hash size={9} />
                      {primary.barcode}
                    </span>
                  )}

                  {product.ikpuCode && (
                    <span className="p-ikpu-badge">
                      <FileCode size={9} />
                      {product.ikpuCode}
                    </span>
                  )}

                  <span className="p-mfr-badge">
                    <Building2 size={9} />
                    {product.manufacturer || "—"}
                  </span>

                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}