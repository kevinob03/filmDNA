function ContentState({ title, message, actionLabel, onAction }) {
  return (
    <div className="content-state" role="status">
      <span className="content-state__symbol" aria-hidden="true">◇</span>
      <h3>{title}</h3>
      <p>{message}</p>
      {onAction && (
        <button className="button button--secondary" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default ContentState
