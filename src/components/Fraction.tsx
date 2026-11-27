/**
 * A score « 39/40 »: shown as is, read « 39 sur 40 » (a screen reader says « barre oblique » for the slash).
 * The visible text is hidden from assistive technology and replaced by the spoken form.
 */
export function Fraction({ value, total }: { value: number; total: number }) {
  return (
    <>
      <span aria-hidden="true">
        {value}/{total}
      </span>
      <span className="sr-only">
        {value} sur {total}
      </span>
    </>
  )
}
