export function ShellForm({ title, description, fields, value, onChange, onSubmit, submitText }) {
  return (
    <form
      className="shell-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="shell-form-header">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="shell-form-grid">
        {fields.map((field) => (
          <label className="field" key={field.name}>
            <span>{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                rows={field.rows || 4}
                value={value[field.name] || ""}
                onChange={(event) => onChange(field.name, event.target.value)}
                placeholder={field.placeholder}
              />
            ) : field.type === "select" ? (
              <select
                value={value[field.name] || ""}
                onChange={(event) => onChange(field.name, event.target.value)}
              >
                {field.options.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                value={value[field.name] || ""}
                onChange={(event) => onChange(field.name, event.target.value)}
                placeholder={field.placeholder}
              />
            )}
          </label>
        ))}
      </div>
      <button className="primary-button" type="submit">
        {submitText}
      </button>
    </form>
  );
}
