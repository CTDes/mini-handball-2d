# Deployed to GitHub Pages by a workflow on every merge to main

The built `index.html` is published to GitHub Pages by a GitHub Actions workflow that runs on
every push to `main`. The workflow lives in `.github/`, a path the factory can never write, so
it is created once in the setup PR, before any feature exists, and publishes an empty page
until milestones fill it. The alternatives (publishing by hand, or a hosting service with its
own CLI and secrets) either break the "every merge is live" loop or add credentials the
repository does not need.
