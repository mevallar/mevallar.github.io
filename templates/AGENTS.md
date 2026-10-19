# templates/ — concert page templates

`concierto.html` (a single concert's page) and `conciertos-listing.html`
(the upcoming/past listing). Both use `{{token}}` placeholders substituted
by `renderTemplate()` in `scripts/build-site.js`.

## Rules

- **An unknown token renders as an empty string — silently.** If you add a
  token to a template, you must also add it to the `data` object passed to
  `renderTemplate` in the matching `render*` function
  (`renderConciertoPage` / `renderListingPage` in `scripts/build-site.js`),
  or it renders as nothing. There is no error for an unknown token.
- The test suite asserts every expected token exists in each template —
  renaming a token means the same rename in the test file's token list.
- After editing: rebuild (`node scripts/build-site.js`) and run
  `grep -rn "{{" dist/` to catch leftover unsubstituted tokens.
