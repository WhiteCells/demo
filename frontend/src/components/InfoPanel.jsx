export function InfoPanel({ title, description, children }) {
  return (
    <section className="info-panel">
      <header className="info-panel-header">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
