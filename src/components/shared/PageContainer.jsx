function PageContainer({ as: Element = 'div', className = '', children }) {
  return <Element className={`page-container ${className}`.trim()}>{children}</Element>
}

export default PageContainer
