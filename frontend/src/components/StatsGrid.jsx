export function StatsGrid({ items }) {
  return (
    <div className="stats-grid">
      {items.map((item) => (
        <section className="stat-card" key={item.label}>
          <span className="stat-label">{item.label}</span>
          <strong className="stat-value">{item.value}</strong>
          {item.trend ? <span className="stat-trend">{item.trend}</span> : null}
        </section>
      ))}
    </div>
  );
}
