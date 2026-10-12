'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="section narrow"><h1>This page could not load</h1><p>Your saved account data is unchanged. Try loading the page again.</p><button type="button" className="button" onClick={reset}>Try again</button></main>; }
