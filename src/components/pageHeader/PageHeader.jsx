import { Plus } from 'lucide-react'
import './pageheader.css'
export const PageHeader=({title, subtitle,btntext,icon:Icon,setAddModal})=>{
    return(
        <div className="page-header">
          <div className="header-text">
            <h1><Icon size={24} strokeWidth={2.2} className="h1-icon" />{title}</h1>
            <p className="subtitle">{subtitle}</p>
          </div>
          <button className="btn-primary" onClick={() => setAddModal(true)}>
            <Plus size={16} strokeWidth={2.5} />{btntext}
          </button>
        </div>
    )
}