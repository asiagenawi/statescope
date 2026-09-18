/**
 * Turn the bare [1] / [2] citation markers Claude is instructed to emit into
 * markdown links pointing at the numbered source list under the answer.
 *
 * Two things this must not do: rewrite a genuine markdown link (hence the
 * negative lookahead for an opening paren), and mint a link to a source that
 * does not exist (hence the bounds check) -- a dead citation would undermine
 * the very thing the source list is there to establish.
 */
export function linkifyCitations(content, sourceCount) {
  if (!content || !sourceCount) return content
  return content.replace(/\[(\d+)\](?!\()/g, (match, n) => {
    const index = Number(n)
    return index >= 1 && index <= sourceCount ? `[${n}](#cite-${n})` : match
  })
}
