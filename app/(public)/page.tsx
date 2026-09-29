import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DayPanel,
  DesktopCalendar,
  PhoneStandings,
  PointsPanel,
  PublishPanel,
} from '@/components/marketing/product-preview';
import { VideoFacade } from '@/components/marketing/video-facade';
import { ShowcaseLeagues, Testimonials } from '@/components/marketing/social-proof';
import { site } from '@/content/site';
import { pageMeta } from '@/content/seo';

/**
 * The landing page of dxscores.com (PHASE5A_PRODUCT_SITE §6).
 *
 * One job: a league organiser understands in ten seconds what this does, trusts it in one minute,
 * and signs up in three. It presents a management product — the calendar first, the standings as
 * its consequence — because the owner read the first draft as "a calculator", and the calendar,
 * halls and clash detection are what an organiser works in every week. The product is shown as
 * its three modules — organisation, points, publication — which is how the owner describes it.
 *
 * Every claim is something the product does today, and nothing is invented: no users, no quotes,
 * no numbers until there are real ones (`content/site.ts` holds the slots). Also served at /home,
 * for signed-in readers, with this page as its canonical.
 */
export const metadata: Metadata = pageMeta({
  title: 'DXScores — organisez votre saison, le classement se calcule tout seul',
  description:
    'Calendrier, salles, résultats et classement de votre ligue, au même endroit et publiés sur son propre site. Gratuit.',
  path: '/',
  absoluteTitle: true,
});

/**
 * Who publishes the site, for search engines (§8.4). No SoftwareApplication block: Google only
 * shows that rich result with ratings or reviews, and this product invents neither.
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'DXScores',
      url: 'https://dxscores.com',
      logo: 'https://dxscores.com/apple-icon',
      email: site.contact.email,
    },
    {
      '@type': 'WebSite',
      name: 'DXScores',
      url: 'https://dxscores.com',
      inLanguage: 'fr',
    },
  ],
};

const wrap = 'mx-auto max-w-6xl px-4 sm:px-6';

/** French typography: a non-breaking space before ? ! : ; so the mark never starts a line. */
const fr = (s: string) => s.replace(/ ([?!:;])/g, ' $1');

/** The problem as it is lived, told in a sentence rather than listed (owner's review, 2026-09-29). */
const problem =
  'Le calendrier vit dans un fichier, les résultats arrivent par messages, et après chaque journée quelqu’un refait le classement à la main — avant qu’un graphiste ne le redessine pour les réseaux sociaux. En fin de saison, les chiffres sont contestés, et plus personne ne sait d’où vient un point.';

/** The answer, point for point, in the order the problem tells it. */
const withDx = [
  'Calendrier, résultats et classement au même endroit, publiés sur le site de la ligue.',
  'Le classement se met à jour à chaque score saisi.',
  'Le classement officiel s’exporte en image, prêt pour WhatsApp.',
  'Chaque point se retrace jusqu’au match qui l’a donné.',
];

/**
 * The three modules the product is made of. Each feeds the next: a game placed becomes a result,
 * a result becomes a table, a table becomes a page anyone can read. A fourth — growth: a league's
 * own website, tickets, sponsors — is for later, and is not announced here.
 */
const modules = [
  {
    label: 'Organisation',
    title: 'Le calendrier, les salles, les imprévus.',
    lead: 'Toutes vos compétitions sur une seule grille, là où votre ligue se gère chaque semaine.',
    points: [
      'Matchs, salles et horaires de toutes vos compétitions : messieurs, dames, jeunes.',
      'Un conflit de salle ou d’équipe est signalé avant qu’il n’arrive.',
      'Le programme de chaque équipe, de la première à la dernière journée.',
      'Les étapes de la saison : saison régulière, poules, phase finale.',
      'Reports et annulations, avec leur motif, gardés dans l’historique du match.',
    ],
    Visual: DayPanel,
  },
  {
    label: 'Points',
    title: 'Chaque score devient un classement.',
    lead: 'Le moteur de points applique vos règles à chaque résultat saisi : classement et statistiques se mettent à jour seuls.',
    points: [
      'Vos règles : points par victoire, défaite et forfait, départages, qualification et relégation.',
      'La feuille de marque par joueur, et le classement des marqueurs.',
      'En cours de saison, les matchs déjà joués s’importent depuis Excel.',
      'Chaque point se retrace jusqu’au match qui l’a donné.',
    ],
    Visual: PointsPanel,
  },
  {
    label: 'Publication',
    title: 'Votre ligue, vue de tous.',
    lead: 'Ce que vous saisissez est publié aussitôt, sur le site de votre ligue et dans les formats que l’on partage.',
    points: [
      'Le site de votre ligue, votre-ligue.dxscores.app : classement, calendrier, résultats, communiqués.',
      'Le classement officiel en PDF, avec en-tête, cachet et signature.',
      'En image pour WhatsApp, en Excel pour vos archives.',
      'Lisible sur n’importe quel téléphone, sans rien installer.',
    ],
    Visual: PublishPanel,
  },
];

const steps = [
  {
    title: 'Créez votre ligue',
    text: 'Vos compétitions, vos équipes. Quelques minutes, même en pleine saison.',
  },
  {
    title: 'Placez vos matchs, saisissez les scores',
    text: 'Le calendrier dans la grille, le score final en quelques secondes depuis votre téléphone.',
  },
  {
    title: 'Partagez',
    text: 'Votre ligue est en ligne sur votre-ligue.dxscores.app, à jour à chaque score.',
  },
];

const faq = [
  {
    q: 'Faut-il installer quelque chose ?',
    a: 'Non. DXScores s’ouvre dans le navigateur, sur téléphone comme sur ordinateur.',
  },
  {
    q: 'Notre saison a déjà commencé. C’est trop tard ?',
    a: 'Non. Vous saisissez les matchs déjà joués avec leur score, et le classement se reconstruit.',
  },
  {
    q: 'Les joueurs doivent-ils créer un compte ?',
    a: 'Non. Les effectifs sont saisis par la ligue.',
  },
  {
    q: 'Qui peut modifier les résultats ?',
    a: 'Seulement les personnes que vous invitez. Chaque modification d’un match est gardée dans son historique.',
  },
  {
    q: 'Quels sports ?',
    a: 'Tous les sports collectifs qui se jouent en matchs et en classement : basketball, football, volleyball, handball… Les règles de points se règlent pour chaque compétition. La feuille de marque par joueur est, pour l’instant, celle du basketball.',
  },
  {
    q: 'Est-ce vraiment gratuit ?',
    a: 'Oui. Gérer votre ligue du début à la fin de la saison est gratuit. Une offre Pro viendra plus tard avec des outils avancés.',
  },
];

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-soft/50 via-canvas to-canvas"
        />
        <div className={`${wrap} relative pt-16 text-center sm:pt-24`}>
          {/* Two sentences, two lines: the first says what the product is (management), the second
              what it does that nothing else does. Broken anywhere else it read as one run-on. */}
          <h1 className="mx-auto mt-6 max-w-5xl text-balance text-display font-bold text-ink">
            <span className="block">Organisez votre saison.</span>
            <span className="block text-accent-text">Le classement se calcule tout seul.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            {fr(
              'Calendrier, salles, résultats, feuilles de marque : DXScores tient toute la saison de votre ligue, la publie sur le site de la ligue et produit le classement officiel, prêt à partager sur WhatsApp.',
            )}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              variant="primary"
              size="lg"
              className="group motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
            >
              <Link href="/register">
                Créer ma ligue — gratuit
                <ArrowRight
                  className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Button>
            {site.demoUrl ? (
              <Button asChild variant="outline" size="lg">
                <a href={site.demoUrl} target="_blank" rel="noopener noreferrer">
                  Voir un exemple
                </a>
              </Button>
            ) : (
              <Button asChild variant="outline" size="lg">
                <Link href="#comment-ca-marche">Comment ça marche</Link>
              </Button>
            )}
          </div>
          <p className="mt-4 text-sm text-ink-subtle">
            Sans carte bancaire. Le site de votre ligue est en ligne dès l’inscription.
          </p>
        </div>

        {/* The organiser's side and the supporter's side: the calendar on a laptop, the standings
            on a phone. Drawn for now (fictional clubs); the demo league's real screens replace it
            once the league site is rebuilt. On a phone only the phone is shown — a laptop drawn
            at that width would be unreadable. */}
        <figure className="relative mx-auto mt-14 max-w-4xl px-4 pb-16 sm:px-6 sm:pb-24">
          {/* The phone overlaps the laptop with a negative margin, in the flow — positioned
              absolutely it reserved no height and ran off the bottom of the section. */}
          <div className="flex items-start justify-center">
            <DesktopCalendar className="hidden md:block" />
            <PhoneStandings className="relative z-10 md:-ml-28 md:mt-14" />
          </div>
          <figcaption className="mt-4 text-center text-xs text-ink-subtle">Exemple illustratif</figcaption>
        </figure>
      </section>

      {/* ---------- The problem, and the answer ---------- */}
      <section className={`${wrap} reveal py-16 sm:py-24`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Pourquoi DXScores</p>
        <h2 className="mt-3 max-w-2xl text-title font-bold text-ink">{fr('Chaque journée, la même corvée.')}</h2>
        {/* The answer leads on a wide screen, on the left; the problem sits beside it as prose. On a
            phone the problem comes first, so the page still reads problem, then answer. */}
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="border-l-2 border-line-strong pl-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Aujourd’hui</p>
            <p className="mt-4 text-xl italic leading-relaxed text-ink-muted sm:text-2xl">{fr(problem)}</p>
          </div>
          <div className="rounded-2xl border border-accent-line bg-accent-soft/50 p-6 shadow-e1 sm:p-10 lg:order-first">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Avec DXScores</p>
            <ul className="mt-6 space-y-5">
              {withDx.map((t) => (
                <li key={t} className="flex items-start gap-3 text-lg text-ink">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-positive" aria-hidden />
                  <span>{fr(t)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- The three modules ---------- */}
      <section id="fonctionnalites" className="scroll-mt-20 border-y border-line bg-surface">
        <div className={`${wrap} py-16 sm:py-24`}>
          <div className="reveal max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Fonctionnalités</p>
            <h2 className="mt-3 text-title font-bold text-ink">Trois modules, une seule saison.</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              {fr(
                'Organiser, compter, publier. Chacun alimente le suivant : un match placé devient un résultat, un résultat devient un classement, un classement devient une page que tout le monde peut lire.',
              )}
            </p>
          </div>
          <div className="mt-14 space-y-16 sm:mt-20 sm:space-y-24">
            {modules.map((m, i) => (
              <article key={m.label} className="reveal grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={i % 2 ? 'lg:order-last' : undefined}>
                  <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-accent-text">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm tabular-nums text-accent-ink">
                      {i + 1}
                    </span>
                    {m.label}
                  </p>
                  <h3 className="mt-4 text-balance text-2xl font-bold text-ink sm:text-3xl">{fr(m.title)}</h3>
                  <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-muted">{fr(m.lead)}</p>
                  <ul className="mt-6 space-y-3">
                    {m.points.map((t) => (
                      <li key={t} className="flex items-start gap-3 text-ink">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-positive" aria-hidden />
                        <span>{fr(t)}</span>
                      </li>
                    ))}
                  </ul>
                  {m.Visual === PublishPanel && site.demoUrl && (
                    <Button asChild variant="outline" size="lg" className="mt-8">
                      <a href={site.demoUrl} target="_blank" rel="noopener noreferrer">
                        Visiter le site de démonstration
                      </a>
                    </Button>
                  )}
                </div>
                {/* A backdrop the width of the column, so the drawing is the row's other half
                    rather than a small card floating in white space. */}
                <div className="flex justify-center rounded-2xl border border-line bg-canvas px-4 py-10 sm:px-10 sm:py-14">
                  <m.Visual />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="comment-ca-marche" className={`${wrap} reveal scroll-mt-20 py-16 sm:py-24`}>
        <h2 className="text-title font-bold text-ink">Comment ça marche</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((s, i) => (
            <li key={s.title}>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-accent-ink shadow-e1">
                  {i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span aria-hidden className="hidden h-px flex-1 bg-gradient-to-r from-accent-line to-transparent md:block" />
                )}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-muted">{fr(s.text)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Presentation video (hidden until one exists) ---------- */}
      {site.presentationVideoId && (
        <section id="video" className={`${wrap} reveal scroll-mt-20 pb-16 sm:pb-24`}>
          <h2 className="text-title font-bold text-ink">Voir DXScores en quelques minutes</h2>
          <div className="mt-8 max-w-4xl">
            <VideoFacade id={site.presentationVideoId} title="Présentation de DXScores" />
          </div>
        </section>
      )}

      <ShowcaseLeagues />
      <Testimonials />

      {/* ---------- Free ---------- */}
      <section id="gratuit" className={`${wrap} reveal scroll-mt-20 pb-16 sm:pb-24`}>
        <div className="rounded-2xl border border-line bg-surface p-8 text-center sm:p-12">
          <h2 className="text-title font-bold text-ink">Gratuit.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink">
            Gérer votre ligue, du premier match au dernier classement, ne coûte rien.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-muted">
            Une offre Pro viendra plus tard avec des outils avancés, comme la génération automatique du
            calendrier.
          </p>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="border-t border-line bg-surface">
        <div className={`${wrap} reveal grid gap-10 py-16 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]`}>
          <h2 className="text-title font-bold text-ink">Questions fréquentes</h2>
          <div className="divide-y divide-line border-y border-line">
            {faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {fr(f.q)}
                  <span
                    aria-hidden
                    className="text-xl leading-none text-ink-subtle transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-ink-muted">{fr(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- The founder ---------- */}
      <section className={`${wrap} reveal py-16 sm:py-24`}>
        <figure className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Un mot du fondateur</p>
          <blockquote className="mt-4 text-lg leading-relaxed text-ink">
            {fr(
              'Entraîneur de basketball chez les jeunes, je tenais à la main le classement, le calendrier et les statistiques de mon équipe. J’ai créé DXScores pour que les ligues n’aient plus à le faire — et pour qu’elles soient vues : ce qui manque le plus au sport africain, c’est l’organisation et la visibilité.',
            )}
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-text"
            >
              IR
            </span>
            <span className="text-sm">
              <span className="block font-semibold text-ink">{site.founder.name}</span>
              <span className="text-ink-muted">
                Fondateur ·{' '}
                <a href={site.contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="link-grow">
                  WhatsApp {site.contact.whatsappDisplay}
                </a>
              </span>
            </span>
          </figcaption>
        </figure>
      </section>

      {/* ---------- Final call to action ---------- */}
      <section className={`${wrap} pb-20`}>
        <div className="reveal flex flex-col items-start gap-6 rounded-2xl bg-accent px-6 py-10 sm:px-12 sm:py-12 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-xl text-title font-bold text-accent-ink">
            Votre prochaine journée, sans calcul à la main.
          </h2>
          <Link
            href="/register"
            className="group inline-flex shrink-0 items-center gap-2 rounded-md bg-canvas px-5 py-3 font-semibold text-ink shadow-e1 transition-colors hover:bg-surface motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
          >
            Créer ma ligue — gratuit
            <ArrowRight
              className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </section>
    </>
  );
}
