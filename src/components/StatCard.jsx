import "./statcard.css";

export const StatCard=({
  title,
  value,
  icon: Icon,
  color = "blue",
}) =>{
  return (
    <div className={`stat-card stat-${color}`}>
      <div className={`stat-icon icon-${color}`}>
        <Icon size={17} strokeWidth={2} />
      </div>

      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
      </div>
    </div>
  );
}