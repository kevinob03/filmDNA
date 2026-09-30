function FaqList({ items, labelledBy }) {
  return <section className="faq-list" aria-labelledby={labelledBy}>
    {items.map(([question, answer]) => <details key={question} className="faq-item">
      <summary>{question}<span aria-hidden="true">+</span></summary>
      <p>{answer}</p>
    </details>)}
  </section>
}

export default FaqList
