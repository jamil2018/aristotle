# Authentication example

`tests/e2e/auth.setup.ts` creates synthetic ignored storage state for the
controlled harness. Real credentials must be supplied through environment
variables and must never be committed. The setup project runs before browser
projects, and authentication failures are triaged rather than silently retried
or converted into application changes.
