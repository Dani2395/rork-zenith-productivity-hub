import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Zenith Productivity Hub</title>
        <style>{`
          html, body, #root { height: 100%; margin: 0; padding: 0; }
          body { overflow: hidden; }
          * { box-sizing: border-box; }
          div[data-rnw-class] { display: flex; flex-direction: column; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
