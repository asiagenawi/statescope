/**
 * The ▴/▾ glyphs render inconsistently and very faintly in Inter, so disclosure
 * arrows are drawn rather than typed.
 */
function Caret({ open }) {
  return (
    <svg
      className={`caret${open ? ' caret--open' : ''}`}
      viewBox="0 0 10 10"
      width="9"
      height="9"
      aria-hidden="true"
    >
      <path d="M2.5 4l2.5 2.5L7.5 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default Caret
