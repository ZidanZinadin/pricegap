/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriceGap",
  description:
    "Search UK stores once and compare live prices, offers, and retailer availability."
};

const tailwindConfig = `
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          background: "#faf8ff",
          "on-secondary-fixed": "#002108",
          "secondary-container": "#82f893",
          "tertiary-fixed-dim": "#ffb59d",
          "on-tertiary": "#ffffff",
          "on-secondary": "#ffffff",
          "secondary-fixed": "#85fb96",
          secondary: "#006e2a",
          "surface-container-high": "#e7e7f4",
          "surface-container-lowest": "#ffffff",
          "surface-container": "#ecedfa",
          "surface-container-low": "#f2f3ff",
          "on-error": "#ffffff",
          primary: "#004ccd",
          "inverse-primary": "#b4c5ff",
          "on-primary-fixed-variant": "#003da9",
          "primary-fixed-dim": "#b4c5ff",
          "surface-bright": "#faf8ff",
          "on-secondary-container": "#00732c",
          error: "#ba1a1a",
          outline: "#737687",
          "surface-variant": "#e1e1ee",
          "surface-dim": "#d8d9e6",
          "outline-variant": "#c3c6d8",
          tertiary: "#9e3100",
          "tertiary-container": "#c84000",
          "surface-tint": "#0052dd",
          "on-tertiary-fixed-variant": "#832700",
          "on-background": "#191b24",
          "on-secondary-fixed-variant": "#00531e",
          "tertiary-fixed": "#ffdbd0",
          "surface-container-highest": "#e1e1ee",
          "error-container": "#ffdad6",
          surface: "#faf8ff",
          "on-primary": "#ffffff",
          "on-tertiary-fixed": "#390c00",
          "on-tertiary-container": "#fff1ed",
          "on-primary-container": "#f3f3ff",
          "on-surface": "#191b24",
          "on-error-container": "#93000a",
          "primary-container": "#0f62fe",
          "on-primary-fixed": "#00174c",
          "inverse-surface": "#2e303a",
          "inverse-on-surface": "#eff0fd",
          "secondary-fixed-dim": "#69de7c",
          "on-surface-variant": "#424656",
          "primary-fixed": "#dbe1ff"
        },
        borderRadius: {
          DEFAULT: "0.125rem",
          lg: "0.25rem",
          xl: "0.5rem",
          full: "0.75rem"
        },
        spacing: {
          gutter: "24px",
          sm: "16px",
          md: "24px",
          xxs: "4px",
          "container-max": "1280px",
          base: "8px",
          xl: "48px",
          lg: "32px",
          xs: "8px"
        },
        fontFamily: {
          "body-md": ["Inter"],
          "price-display": ["Inter"],
          h3: ["Inter"],
          "body-sm": ["Inter"],
          h1: ["Inter"],
          h2: ["Inter"],
          "body-lg": ["Inter"],
          "label-caps": ["Inter"]
        },
        fontSize: {
          "body-md": ["16px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
          "price-display": ["28px", { lineHeight: "1.0", letterSpacing: "-0.03em", fontWeight: "700" }],
          h3: ["20px", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "600" }],
          "body-sm": ["14px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
          h1: ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
          h2: ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
          "body-lg": ["18px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
          "label-caps": ["12px", { lineHeight: "1.0", letterSpacing: "0.05em", fontWeight: "600" }]
        }
      }
    }
  };
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body-md min-h-screen">
        <Script
          id="tailwind-cdn"
          src="https://cdn.tailwindcss.com?plugins=forms,container-queries"
          strategy="beforeInteractive"
        />
        <Script id="tailwind-config" strategy="beforeInteractive">
          {tailwindConfig}
        </Script>
        {children}
      </body>
    </html>
  );
}
