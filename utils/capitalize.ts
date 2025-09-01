export function capitalize(word?: string) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function capitalizeFirst(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}