import "./searchInput.css";
import { Search, X } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Qidirish...",
}) {
  return (
      <div className="p-search-wrap">
          <Search size={15} className="p-search-icon" strokeWidth={2}/>
          <input className="p-search-input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
          {value&&<button className="p-clear" onClick={()=>onChange("")}><X size={13}/></button>}
        </div>
  );
}