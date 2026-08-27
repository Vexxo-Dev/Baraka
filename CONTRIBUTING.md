# Contributing

Baraka is a solo project, but pull requests are welcome. `main` is protected, so direct pushes aren't possible for anyone but the maintainer. The only way to contribute is:

1. Fork the repo.
2. Create a branch for your change.
3. Open a pull request against `main`.

A few things that will make a PR easier to review and merge:

- Keep PRs focused. One change per PR is better than a bundle of unrelated fixes.
- Run `npm run typecheck` and `npm test` before opening the PR. Both should pass.
- For anything content-related (activities, niyyah text, hadith references), see the [theological constraints](./README.md#overview). Every niyyah must trace to a canonical, verified hadith reference (Bukhari, Muslim, Tirmidhi, Abu Dawud, Ibn Majah, or Nasai) with a specific number. PRs adding or changing content without a verifiable source won't be merged.
- For anything bigger than a small fix, opening an issue first to discuss the approach is appreciated but not required.

All PRs are reviewed by the maintainer before merging. There's no fixed turnaround time, since this is a side project and not something with an SLA. Issues describing genuine bugs are also welcome, even if you don't want to open a PR yourself.
