const paths = {
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8 10h.01M16 10h.01M8.5 15a5 5 0 0 0 7 0" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
  coffee: <><path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" /><path d="M16 10h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2" /></>,
  bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />,
  spark: <><path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
  ghost: <path d="M5 20V10a7 7 0 0 1 14 0v10l-3-2-2 2-2-2-2 2-2-2-3 2ZM9 10h.01M15 10h.01" />,
  bulb: <><path d="M9 18h6M10 22h4" /><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.9.7-1.5 1.5-1.5 2.5h-4c0-1-.6-1.8-1.5-2.5Z" /></>,
  tune: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
  magic: <><path d="m15 4 5 5L8 21l-5-5L15 4Z" /><path d="m6 14 5 5M6 3v3M4.5 4.5h3M19 15v4M17 17h4" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  bookmark: <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z" />,
  hide: <><path d="M3 3l18 18" /><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 21 12a12 12 0 0 1-3.1 4.3M6.2 6.2A12.2 12.2 0 0 0 3 12s3 7 9 7c1 0 2-.2 2.9-.5" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
}

function FilterIcon({ name, size = 20 }) {
  return <svg className="filter-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default FilterIcon
