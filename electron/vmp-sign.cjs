// electron-builder afterPack hook: VMP-sign the packaged app with castlabs EVS
// so Widevine-protected playback (Spotify) works in DISTRIBUTED builds.
//
// This is Widevine's own "Verified Media Path" signature and is independent of
// Apple/Windows code signing. It's free via castlabs EVS but needs a one-time
// account (see electron/README.md). This hook is best-effort: if the EVS tool or
// credentials aren't present it warns and continues, so unsigned dev/CI builds
// still succeed (Spotify just won't play in that packaged build — `npm run
// app:dev` is unaffected and always has working Widevine).

const { execFileSync } = require('child_process');

module.exports = async function vmpSign(context) {
  const { appOutDir } = context;

  // castlabs sign-pkg takes the DIRECTORY that contains the packaged app; it
  // globs for the .app (macOS) / .exe (Windows) inside it.
  const target = appOutDir;

  const python = process.env.PYTHON || 'python3';
  try {
    execFileSync(python, ['-m', 'castlabs_evs.vmp', 'sign-pkg', target], {
      stdio: 'inherit',
    });
    console.log('[vmp-sign] Widevine VMP signature applied in:', target);
  } catch (e) {
    console.warn(
      '\n[vmp-sign] Skipped Widevine VMP signing (' +
        (e.code || e.message) +
        ').\n' +
        '           `npm run app:dev` still has working Widevine, but Spotify\n' +
        '           playback will NOT work in THIS packaged build until castlabs\n' +
        '           EVS is set up. See electron/README.md ("Widevine / Spotify").\n'
    );
  }
};
