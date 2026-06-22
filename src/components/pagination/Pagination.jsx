import './pagination.css'
import { ChevronLeft,ChevronRight } from "lucide-react";

export const Pagination = ({ page, total, onPage }) => {
  if (total<=1) return null;
  return (
    <div className="p-pagination">
      <button className="p-page-btn" disabled={page===1} onClick={()=>onPage(page-1)}><ChevronLeft size={14}/></button>
      {Array.from({length:total},(_,i)=>i+1).map(p=>(
        <button key={p} className={`p-page-btn${p===page?" p-page-active":""}`} onClick={()=>onPage(p)}>{p}</button>
      ))}
      <button className="p-page-btn" disabled={page===total} onClick={()=>onPage(page+1)}><ChevronRight size={14}/></button>
    </div>
  );
}