/**
 * What the product site says that changes as the product grows (PHASE5A_PRODUCT_SITE §3.3, §10).
 *
 * Sections that depend on these render only when there is something real to show: a testimonial
 * section with no testimonials, a video block with no video, a showcase with no leagues — each is
 * hidden rather than faked. Adding the first quote, the first league or the video is a one-line
 * change here, not a design task.
 */

export interface Testimonial {
  quote: string;
  name: string;
  /** Their role and organisation, e.g. « Secrétaire, Ligue de Basketball de Goma ». */
  role: string;
}

export interface ShowcaseLeague {
  name: string;
  /** Their league site, e.g. https://libago.dxscores.app. */
  url: string;
}

export const site = {
  /** The YouTube id of the presentation video (§6.3b). `null` hides the section. */
  presentationVideoId: null as string | null,

  /**
   * The demo league's site (§3.4): fictional clubs on the production league site. "Voir un
   * exemple" opens it in a new tab; `null` would put « Comment ça marche » back in its place.
   */
  demoUrl: 'https://demo.dxscores.app' as string | null,

  /** Real quotes only, with the person's agreement. Empty hides the section. */
  testimonials: [] as Testimonial[],

  /** Real public leagues, curated by hand — never a query, so test sign-ups never appear. */
  showcaseLeagues: [] as ShowcaseLeague[],

  contact: {
    whatsappDisplay: '+243 975 092 470',
    whatsappUrl:
      'https://wa.me/243975092470?text=' +
      encodeURIComponent('Bonjour, je voudrais utiliser DXScores pour ma ligue.'),
    email: 'contact@dxscores.com',
  },

  founder: {
    name: 'Idy Rachid Jonathan',
    role: 'fondateur',
  },
};
