# SearchCab AI – locked live branch

The `searchcab` Vercel project deploys **only** from the `client/searchcab` branch, so kit changes and new demos on
`main` never change this live site.

To bring a kit update to SearchCab on purpose:

```bash
git checkout client/searchcab
git merge main
git push
```

This file is not part of the website.
