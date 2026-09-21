/*
 * Turns whatever someone types (a name, a short passphrase -- their
 * choice) into a storage namespace. Nothing about who has used the
 * app before is ever stored or shown: there is no list of "known"
 * profiles anywhere. Typing the same text again later returns to the
 * same data; typing something else (as a stranger naturally would)
 * gets a separate, empty space. This is not authentication -- anyone
 * who types the same text lands in the same space, so a short
 * made-up phrase is safer than a common first name alone.
 */
function deriveProfileId(text) {
  const normalized = text.trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) | 0; // djb2
  }
  return "u" + (hash >>> 0).toString(36);
}
