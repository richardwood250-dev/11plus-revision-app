const esbuild = require('esbuild');
const fs = require('fs');

try {
  console.log('Bundling Excalidraw whiteboard with esbuild...');
  esbuild.buildSync({
    entryPoints: ['scripts/whiteboard-entry.js'],
    bundle: true,
    minify: true,
    outfile: 'public/whiteboard-bundle.js',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    loader: {
      '.png': 'dataurl',
      '.woff2': 'dataurl',
      '.woff': 'dataurl',
      '.ttf': 'dataurl',
      '.svg': 'dataurl',
    },
  });

  // Strip Excalidraw's default open-source demo Firebase key to prevent false-positive GitHub Secret Alerts
  let bundleContent = fs.readFileSync('public/whiteboard-bundle.js', 'utf8');
  bundleContent = bundleContent.replace(/AIzaSyAd15pYlMci_xIp9ko6wkEsDzAAA0Dn0RU/g, 'EXCALIDRAW_PUBLIC_SAMPLE_KEY');
  fs.writeFileSync('public/whiteboard-bundle.js', bundleContent, 'utf8');

  console.log('Bundle complete and sanitized! Created public/whiteboard-bundle.js');
} catch (err) {
  console.error('esbuild failed:', err);
  process.exit(1);
}
