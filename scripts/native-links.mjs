// The files that let belluh.com links open the iOS and Android apps, built from two values the founder sets in
// Vercel (docs/native-app.md). Without them nothing is written, and links keep opening the website.
//   BELLUH_APPLE_TEAM_ID        the 10-character Apple Developer team id
//   BELLUH_ANDROID_CERT_SHA256  SHA-256 fingerprints of the upload key and Play's app signing key, comma-separated
export const BUNDLE_ID = 'com.belluh.app';

/** Pages that open in the app: an invite, Our Afterglow (and its older names) and shared guides */
export const APP_PATHS = [
  { '/': '/', '?': { invite: '?*' }, comment: 'Invites' },
  { '/': '/afterglow*' }, { '/': '/heartprint*' }, { '/': '/locket*' }, { '/': '/passport*' },
  { '/': '/g/*', comment: 'Guides' },
];

export function appleAssociation(teamId) {
  if (!/^[A-Z0-9]{10}$/.test(teamId ?? '')) return null;
  return { applinks: { details: [{ appIDs: [`${teamId}.${BUNDLE_ID}`], components: APP_PATHS }] }, webcredentials: { apps: [`${teamId}.${BUNDLE_ID}`] } };
}

export function androidAssetLinks(fingerprints) {
  const fps = String(fingerprints ?? '').split(',').map(s => s.trim().toUpperCase()).filter(s => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  if (!fps.length) return null;
  return [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: BUNDLE_ID, sha256_cert_fingerprints: fps } }];
}
