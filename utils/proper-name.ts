/** Words that stay lowercase inside a French name. */
const NAME_PARTICLES = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'et', 'a', 'au', 'aux', 'en', 'sur', 'sous', 'pour',
  'par', 'dans', 'chez', 'lez',
]);

/**
 * Tidies a proper noun typed in a hurry.
 *
 * Three rules, each earning its place:
 *  - Short all-caps tokens stay as typed. Clubs here are "BC Virunga", "AS Vita", "FC
 *    Renaissance", and those prefixes are acronyms rather than words; blanket title-casing
 *    renders them "Bc", "As", "Fc".
 *  - Particles stay lowercase unless they open the name, because "Ligue de Basketball de
 *    Kinshasa" is how the organisation writes itself.
 *  - Everything else is normalised, so "MaNIta" becomes "Manita" and "MoUILa" becomes "Mouila".
 *
 * Lives here rather than inside the Input component because names arrive by two routes — typed
 * into a field, and pasted as a block — and a club entered by pasting must not end up spelled
 * differently from the same club entered by hand.
 */
export function toProperName(value: string): string {
  let isFirst = true;
  return value.replace(/[^\s-]+/g, (word) => {
    const leading = isFirst;
    isFirst = false;

    // Particles first: "DU" is short and all-caps, so the acronym rule would otherwise claim it.
    const lower = word.toLocaleLowerCase('fr');
    if (!leading && NAME_PARTICLES.has(lower)) return lower;

    if (word.length <= 3 && word === word.toUpperCase() && /[A-Z]/.test(word)) return word;

    // A short token with no vowel is an acronym whichever case it arrived in: vc, bc, fc, asv,
    // vrg. Uppercasing them turns "vc kabasha" into "VC Kabasha" rather than "Vc Kabasha".
    // Tokens that DO have a vowel are left alone, because "as" and "au" are as likely to be
    // words as abbreviations and guessing wrong there is worse than doing nothing.
    if (word.length <= 3 && !/[aeiouyàâäéèêëîïôöùûü]/i.test(word)) {
      return word.toLocaleUpperCase('fr');
    }

    return word.charAt(0).toLocaleUpperCase('fr') + word.slice(1).toLocaleLowerCase('fr');
  });
}
