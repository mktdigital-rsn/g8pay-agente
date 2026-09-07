This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on DigitalOcean App Platform

The repository includes a DigitalOcean App Platform specification at
`.do/app.yaml`. Create the app from that file with `doctl`:

```bash
doctl apps create --spec .do/app.yaml
```

The spec deploys the `main` branch as a Node.js web service on port `3000`,
uses the repository’s `npm run build` and `npm start` scripts, and configures
`/api/health` as the health-check endpoint.

Before deploying to production, set these optional environment variables in
App Platform’s Settings → App-Level Environment Variables as appropriate:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BRAND`
- `NEXT_PUBLIC_GOOGLE_CALENDAR_URL`
- `NEXT_PUBLIC_D4SIGN_ENV`
- `D4SIGN_API_TOKEN` (secret)
- `D4SIGN_CRYPT_KEY` (secret)
- `D4SIGN_SAFE_UUID` (secret)

The generated contract PDF is returned in the API response and is not intended
to rely on App Platform’s ephemeral local filesystem for persistence.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
