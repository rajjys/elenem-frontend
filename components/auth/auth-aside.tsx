/**
 * The panel beside the form, from `lg` up.
 *
 * Resend fills this space with a gradient and GitHub with an illustration. Neither is available
 * to us and neither would be the strongest thing to put here anyway: what convinces a league
 * president that this is real is the table itself. The design direction already says the product
 * is an official record and that a standings table read cleanly at a glance is worth more than
 * any chart — so the marketing surface is the artefact.
 *
 * The numbers are LIPROBAKIN's own convention: two points a win, one a loss, ranked on points
 * with a differential tiebreak. Presented as an illustration, which is why it is aria-hidden and
 * carries a caption saying so — a made-up table on a page about undisputed numbers has to
 * declare itself.
 */
const ROWS = [
  { pos: 1, team: 'Mazembe BC', p: 12, w: 9, l: 3, diff: '+86', pts: 21 },
  { pos: 2, team: 'Binza City', p: 12, w: 8, l: 4, diff: '+53', pts: 20 },
  { pos: 3, team: 'Chaux Sport', p: 12, w: 8, l: 4, diff: '+41', pts: 20 },
  { pos: 4, team: 'New Generation', p: 11, w: 6, l: 5, diff: '+12', pts: 17 },
  { pos: 5, team: 'Ngaba BC', p: 12, w: 5, l: 7, diff: '−19', pts: 17 },
];

export function StandingsPreview() {
  return (
    <>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink/60">
          Championnat provincial
        </p>
        <h2 className="mt-4 text-3xl xl:text-[2.5rem] leading-[1.15] font-bold tracking-tight text-balance">
          Le classement se calcule tout seul.
        </h2>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-accent-ink/75 max-w-sm">
          Entrez les scores. Elenem tient le tableau, applique vos règles et publie une page que
          vos supporters peuvent partager — sans discussion en fin de saison.
        </p>

        <div
          className="mt-10 rounded-xl bg-accent-ink/[0.07] ring-1 ring-accent-ink/15 backdrop-blur-sm p-1.5 max-w-md"
          aria-hidden
        >
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-accent-ink/50 text-[0.6875rem] uppercase tracking-wider">
                <th className="text-left font-medium px-3 py-2 w-8">#</th>
                <th className="text-left font-medium px-1 py-2">Équipe</th>
                <th className="text-right font-medium px-2 py-2 w-9">J</th>
                <th className="text-right font-medium px-2 py-2 w-12">Diff</th>
                <th className="text-right font-medium px-3 py-2 w-10">Pts</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr
                  key={r.pos}
                  className="border-t border-accent-ink/10 first:border-t-0"
                >
                  <td className="px-3 py-2.5 text-accent-ink/50">{r.pos}</td>
                  <td className="px-1 py-2.5 font-medium whitespace-nowrap">{r.team}</td>
                  <td className="px-2 py-2.5 text-right text-accent-ink/60">{r.p}</td>
                  <td className="px-2 py-2.5 text-right text-accent-ink/60">{r.diff}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{r.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-accent-ink/45">
          Exemple illustratif · 2 points par victoire, 1 par défaite
        </p>
    </>
  );
}
