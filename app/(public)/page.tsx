import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  ListOrdered,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DayPanel, DesktopCalendar, PhoneStandings } from '@/components/marketing/product-preview';
import { VideoFacade } from '@/components/marketing/video-facade';
import { ShowcaseLeagues, Testimonials } from '@/components/marketing/social-proof';
import { site } from '@/content/site';

/**
 * The landing page of dxscores.com (PHASE5A_PRODUCT_SITE §6).
 *
 * One job: a league organiser understands in ten seconds what this does, trusts it in one minute,
 * and signs up in three. It presents a management product — the calendar first, the standings as
 * its consequence — because the owner read the first draft as "a calculator", and the calendar,
 * halls and clash detection are what an organiser works in every week.
 *
 * Every claim is something the product does today, and nothing is invented: no users, no quotes,
 * no numbers until there are real ones (`content/site.ts` holds the slots). Also served at /home,
 * for signed-in readers, with this page as its canonical.
 */
export const metadata: Metadata = {
  title: { absolute: 'DXScores — organisez votre saison, le classement se calcule tout seul' },
  description:
    'Calendrier, salles, résultats et classement de votre ligue, au même endroit et publiés sur son propre site. Gratuit.',
  alternates: { canonical: '/' },
};

const wrap = 'mx-auto max-w-6xl px-4 sm:px-6';

/** French typography: a non-breaking space before ? ! : ; so the mark never starts a line. */
const fr = (s: string) => s.replace(/ ([?!:;])/g, ' $1');

const today = [
  'Le classement recalculé à la main après chaque journée.',
  'Un graphiste qui le refait pour les réseaux sociaux.',
  'Le calendrier dans un fichier, les résultats dans des messages.',
  'Des chiffres contestés en fin de saison.',
];

const withDx = [
  'Le classement se met à jour à chaque score saisi.',
  'Le classement officiel s’exporte en image, prêt pour WhatsApp.',
  'Calendrier, résultats et classement au même endroit, publiés sur le site de la ligue.',
  'Chaque point se retrace jusqu’au match qui l’a donné.',
];

const calendarPoints = [
  'Toutes vos compétitions sur une seule grille : messieurs, dames, jeunes.',
  'Salles et horaires : DXScores signale quand une salle ou une équipe est déjà prise.',
  'Reports, annulations et déplacements, avec leur motif, gardés dans l’historique du match.',
  'Un match se déplace d’un jour à l’autre en le glissant dans la grille.',
  'En cours de saison, les matchs déjà joués s’ajoutent avec leur score.',
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
    text: 'Classement, calendrier et résultats sont à jour sur votre-ligue.dxscores.app. Le classement officiel s’exporte en PDF, en image ou en Excel.',
  },
];

const features = [
  {
    icon: ListOrdered,
    title: 'Un classement selon vos règles',
    text: 'Points par victoire, défaite et forfait, départages, zones de qualification et de relégation.',
  },
  {
    icon: FileCheck2,
    title: 'Le classement officiel, prêt à signer',
    text: 'En-tête, cachet et signature. En PDF à imprimer, en image pour WhatsApp, en Excel.',
  },
  {
    icon: ClipboardList,
    title: 'La feuille de marque',
    text: 'Lancers francs, paniers à 2 et à 3 points par joueur, et le classement des marqueurs.',
  },
  {
    icon: Trophy,
    title: 'Phases et play-offs',
    text: 'Saison régulière, poules, phase finale : vous composez le format, saison après saison.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Vos résultats depuis Excel',
    text: 'En cours de saison, importez d’un coup les matchs déjà joués.',
  },
  {
    icon: Users,
    title: 'Votre équipe',
    text: 'Invitez les personnes qui saisissent les résultats, chacune avec son rôle.',
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
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-soft/50 via-canvas to-canvas"
        />
        <div className={`${wrap} relative pt-16 text-center sm:pt-24`}>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" aria-hidden />
            Gratuit · pour les ligues et fédérations sportives
          </p>
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

      {/* ---------- The chore it replaces ---------- */}
      <section className={`${wrap} reveal py-16 sm:py-24`}>
        <h2 className="max-w-2xl text-title font-bold text-ink">{fr('Chaque journée, la même corvée.')}</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Aujourd’hui</p>
            <ul className="mt-5 space-y-4">
              {today.map((t) => (
                <li key={t} className="flex items-start gap-3 text-ink-muted">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-ink-subtle" aria-hidden />
                  <span>{fr(t)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-accent-line bg-accent-soft/50 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Avec DXScores</p>
            <ul className="mt-5 space-y-4">
              {withDx.map((t) => (
                <li key={t} className="flex items-start gap-3 text-ink">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-positive" aria-hidden />
                  <span>{fr(t)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- The calendar: where an organiser works every week ---------- */}
      <section id="calendrier" className="scroll-mt-20 border-y border-line bg-surface">
        <div className={`${wrap} reveal grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Le calendrier</p>
            <h2 className="mt-3 text-title font-bold text-ink">Toute l’organisation sur une seule grille.</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted">
              {fr(
                'Là où votre ligue se gère chaque semaine : les matchs, les salles, les horaires — et les imprévus.',
              )}
            </p>
            <ul className="mt-6 space-y-3">
              {calendarPoints.map((t) => (
                <li key={t} className="flex items-start gap-3 text-ink">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-positive" aria-hidden />
                  <span>{fr(t)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center lg:justify-end">
            <DayPanel />
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

      {/* ---------- What else it does ---------- */}
      <section id="fonctionnalites" className="scroll-mt-20 border-y border-line bg-surface">
        <div className={`${wrap} reveal py-16 sm:py-24`}>
          <h2 className="text-title font-bold text-ink">Et tout le reste de la saison</h2>
          <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.title} className="group border-t border-line pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-text transition-colors group-hover:bg-accent group-hover:text-accent-ink">
                  <f.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{fr(f.text)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Visibility: the league's own site ---------- */}
      <section className={`${wrap} reveal grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Le site de votre ligue</p>
          <h2 className="mt-3 text-title font-bold text-ink">Votre ligue mérite d’être vue.</h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted">
            Chaque ligue reçoit son propre site — classement, calendrier, résultats — mis à jour à
            chaque score, sans que personne n’ait à le tenir.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Toujours à jour : il change à chaque résultat saisi.',
              'Lisible sur n’importe quel téléphone.',
              'À votre nom : votre-ligue.dxscores.app.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-ink">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-positive" aria-hidden />
                <span>{fr(t)}</span>
              </li>
            ))}
          </ul>
          {site.demoUrl && (
            <Button asChild variant="outline" size="lg" className="mt-8">
              <a href={site.demoUrl} target="_blank" rel="noopener noreferrer">
                Visiter le site de démonstration
              </a>
            </Button>
          )}
        </div>
        <div className="flex justify-center lg:justify-end">
          <PhoneStandings />
        </div>
      </section>

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
