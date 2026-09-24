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

## UI components

Reusable controls in `components/ui/` follow the shadcn/ui open-code pattern. `components.json` configures the CLI for this Next.js and Tailwind CSS project. To add another component, run `npx shadcn@latest add <component>` from this directory, then review its classes against the light and dark theme tokens in `app/globals.css`.

Home, Library, and navigation currently use the shared Button, Input, Badge, and Alert components. Dialogs and account menus still use the existing custom components.

## Image credits

The homepage hero uses a resized [photograph of Mt. Pulag](https://commons.wikimedia.org/wiki/File:Panoramic_Shot_of_Mt._Pulag_Summit_and_Grassland.jpg) by Bien02, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). It is displayed with a crop and dark overlay for readable text.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
