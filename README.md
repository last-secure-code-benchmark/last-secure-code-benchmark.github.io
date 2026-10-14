# LSCBench website

Source of [last-secure-code-benchmark.github.io](https://last-secure-code-benchmark.github.io), the project page of the Last Secure Code Benchmark (LSCBench).

The tasks and agent traces live in [alibaba/last-secure-code-benchmark](https://github.com/alibaba/last-secure-code-benchmark). The traces browser reads them from that repository at the `v1.0` tag; `src/lib/traces.ts` sets the location. The leaderboard numbers are fixed in `src/data/leaderboard.json` and match the paper.

## Develop

```bash
npm ci
npm run dev
```

## Deploy

Every push to `main` builds the static site with `npm run build`, which writes it to `out/`, and publishes it to GitHub Pages through `.github/workflows/deploy.yml`. In the repository settings, set Pages to deploy from GitHub Actions.
