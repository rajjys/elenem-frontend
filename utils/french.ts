/**
 * « de Jean », « d’Alphonse », « d’AS Goma » — French elides de before a vowel or a mute h. One
 * helper, because « Activité de Alphonse » and « De AS Goma à … » were the same mistake twice.
 */
export function de(name: string, capital = false): string {
  const elided = /^[aeiouyhàâäéèêëîïôöùûü]/i.test(name);
  const word = elided ? 'd’' : 'de ';
  return `${capital ? word.charAt(0).toUpperCase() + word.slice(1) : word}${name}`;
}
