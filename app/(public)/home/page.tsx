import Landing from '../page';

/**
 * The landing, at an address a signed-in reader can still reach.
 *
 * `/` sends a signed-in reader to their dashboard (middleware), so the landing needs a second
 * address for when they want it — the account menu links here. Search engines never carry a
 * session, so for them `/` is the landing, and this page says so: its canonical is `/`, and it is
 * never indexed as a page of its own (the Vercel and Resend `/home` model).
 */
export { metadata } from '../page';

export default Landing;
