const esbuild = require('esbuild');

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
  console.log('Bundle complete! Created public/whiteboard-bundle.js');
} catch (err) {
  console.error('esbuild failed:', err);
  process.exit(1);
}
