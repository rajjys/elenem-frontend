import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  FileCheck2,
  Keyboard,
  ListOrdered,
  Share2,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneStandings, ScoreEntryCard } from '@/components/marketing/product-preview';
import { VideoFacade } from '@/components/marketing/video-facade';
import { ShowcaseLeagues, Testimonials } from '@/components/marketing/social-proof';
import { site } from '@/content/site';

/**
 * The landing page of dxscores.com (PHASE5A_PRODUCT_SITE §6).
 *
 * One job: a league organiser understands in ten seconds what this does, trusts it in one minute,
 * and signs up in three. Every claim is something the product does today — the plan's §6.4 lists
 * what backs each one — and nothing here is invented: no users, no quotes, no numbers until there
 * are real ones (`content/site.ts` holds the slots). It is also served at /home, for signed-in
 * readers, with this page as its canonical.
 */
export const metadata: Metadata = {
  title: { absolute: 'DXScores — le classement se calcule tout seul' },
  description:
    'Saisissez les scores : DXScores tient le calendrier, calcule le classement selon vos règles et le publie sur le site de votre ligue. Gratuit.',
  alternates: { canonical: '/' },
};

const wrap = 'mx-auto max-w-6xl px-4 sm:px-6';

const steps = [
  {
    icon: UserPlus,
    title: 'Créez votre ligue.',
    text: 'Vos compétitions, vos équipes. Quelques minutes, même en pleine saison.',
  },
  {
    icon: Keyboard,
    title: 'Saisissez les résultats.',
    text: 'Le score final en quelques secondes, depuis votre téléphone. La feuille de marque quand vous l’avez.',
  },
  {
    icon: Share2,
    title: 'Partagez.',
    text: 'Classement, calendrier et résultats sont à jour sur votre-ligue.dxscores.app. Le classement officiel s’exporte en PDF, en image ou en Excel.',
  },
];

const features = [
  {
    icon: CalendarDays,
    title: 'Un calendrier pour toutes vos compétitions',
    text: 'Salles, horaires, conflits détectés, reports et annulations avec leur motif.',
  },
  {
    icon: ListOrdered,
    title: 'Un classement qui se calcule seul',
    text: 'Vos règles de points, les forfaits, les départages, les zones de qualification et de relégation.',
  },
  {
    icon: FileCheck2,
    title: 'Le classement officiel, prêt à signer',
    text: 'En-tête, cachet et signature. En PDF à imprimer, en image pour WhatsApp, en Excel.',
  },
  {
    icon: ClipboardList,
    title: 'La feuille de marque',
    text: 'Lancers francs, paniers à 2 et à 3 points par joueur — et les meilleurs marqueurs.',
  },
  {
    icon: Trophy,
    title: 'Phases et play-offs',
    text: 'Poules, phase finale, barrages : vous composez le format, saison après saison.',
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
    a: 'Oui. Tout ce que DXScores fait aujourd’hui restera gratuit. Des offres Pro, avec des fonctionnalités en plus, pourront venir plus tard — elles s’ajouteront, elles ne retireront rien.',
  },
];

/** French typography: a non-breaking space before ? ! : ; so the mark never starts a line. */
const fr = (s: string) => s.replace(/ ([?!:;])/g, ' $1');

export default function LandingPage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-soft/50 via-canvas to-canvas"
        />
        <div className={`${wrap} relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]`}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" aria-hidden />
              Gratuit · pour les ligues et fédérations sportives
            </p>
            <h1 className="mt-6 text-balance text-display font-bold text-ink">
              Le classement se calcule <span className="text-accent-text">tout seul.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
              Saisissez les scores de vos matchs. DXScores tient le calendrier, calcule le classement
              selon vos règles et le publie sur le site de votre ligue — avec le classement officiel
              prêt à partager sur WhatsApp.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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

          {/* The score card tucks under the phone's bottom edge rather than over its table: laid
              across the table it hid the relegation row, which is half of what the table shows. */}
          <figure className="relative mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end">
            <PhoneStandings className="relative z-10 mx-auto lg:mr-0" />
            <ScoreEntryCard className="relative z-20 -mt-4 hidden sm:mx-auto sm:block lg:-ml-16 lg:mr-auto" />
            <figcaption className="mt-3 text-center text-xs text-ink-subtle lg:text-right">
              Exemple illustratif
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ---------- The chore it replaces ---------- */}
      <section className={`${wrap} reveal grid gap-8 py-16 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16`}>
        <h2 className="text-title font-bold text-ink">{fr('Chaque journée, la même corvée.')}</h2>
        <div className="space-y-4 text-lg leading-relaxed text-ink-muted">
          <p>
            Quelqu’un recalcule le classement à la main. Un graphiste le refait pour les réseaux. Et à
            la fin de la saison, les chiffres sont contestés.
          </p>
          <p className="font-semibold text-ink">
            Avec DXScores, le classement vient des matchs. Chacun peut voir d’où vient chaque point.
          </p>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="comment-ca-marche" className="scroll-mt-20 border-y border-line bg-surface">
        <div className={`${wrap} reveal py-16 sm:py-24`}>
          <h2 className="text-title font-bold text-ink">Comment ça marche</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-line bg-canvas p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">
                    {i + 1}
                  </span>
                  <s.icon className="h-5 w-5 text-accent-text" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-muted">{fr(s.text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Presentation video (hidden until one exists) ---------- */}
      {site.presentationVideoId && (
        <section id="video" className={`${wrap} reveal scroll-mt-20 py-16 sm:py-24`}>
          <h2 className="text-title font-bold text-ink">Voir DXScores en quelques minutes</h2>
          <div className="mt-8 max-w-4xl">
            <VideoFacade id={site.presentationVideoId} title="Présentation de DXScores" />
          </div>
        </section>
      )}

      {/* ---------- What it does ---------- */}
      <section id="fonctionnalites" className={`${wrap} reveal scroll-mt-20 py-16 sm:py-24`}>
        <h2 className="text-title font-bold text-ink">Ce que fait DXScores</h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Ce dont une ligue a besoin chaque semaine — et rien que vous auriez à maintenir.
        </p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li
              key={f.title}
              className="rounded-xl border border-line bg-surface p-6 transition-colors hover:border-line-strong motion-safe:transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-e2"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
                <f.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{fr(f.text)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Visibility: the league's own site ---------- */}
      <section className="border-y border-line bg-surface">
        <div className={`${wrap} reveal grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2`}>
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
        </div>
      </section>

      <ShowcaseLeagues />
      <Testimonials />

      {/* ---------- Free ---------- */}
      <section id="gratuit" className={`${wrap} reveal scroll-mt-20 py-16 sm:py-24`}>
        <div className="rounded-2xl border border-line bg-surface p-8 sm:p-12">
          <h2 className="text-title font-bold text-ink">Gratuit. Vraiment.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
            DXScores est gratuit : pas de carte bancaire, pas de limite d’équipes ni de compétitions.
            Tout ce que DXScores fait aujourd’hui restera gratuit. Des offres Pro, avec des
            fonctionnalités en plus, pourront venir plus tard — elles s’ajouteront, elles ne
            retireront rien.
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
        <figure className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Un mot du fondateur</p>
          <blockquote className="mt-4 space-y-4 text-lg leading-relaxed text-ink">
            <p>
              Je suis entraîneur de basketball chez les jeunes. Chaque saison, suivre le classement, le
              calendrier et les statistiques de mon équipe voulait dire prendre des notes à la main —
              et c’était pénible. J’ai construit DXScores pour que les petites ligues gardent la trace
              de leur saison, et que chaque équipe puisse mieux se préparer.
            </p>
            <p>
              Beaucoup de ligues restent petites, pas seulement faute de moyens, mais parce que
              personne ne les voit. Et un talent qu’on ne voit pas, personne ne peut le révéler.
              {fr(' S’il y a deux choses qui manquent au sport en Afrique, ce sont l’organisation et la visibilité. ')}
              DXScores existe pour apporter les deux.
            </p>
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
        <div className="reveal flex flex-col items-start gap-6 rounded-2xl bg-accent px-8 py-12 sm:px-12 md:flex-row md:items-center md:justify-between">
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
