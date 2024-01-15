import * as esbuild from 'esbuild'
import pkg from './package.json' assert { type: "json" };

const { main } = pkg;

await esbuild.build({
  entryPoints: [main],
  target: "es2020",
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'node',
  outfile: 'dist/handler.js',
})