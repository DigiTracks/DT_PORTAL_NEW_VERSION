export function GET() {
  const manifest = {
    name: "SourceCraft by DigiTracks",
    short_name: "SourceCraft",
    description: "Public procurement vocabulary index with local favourites and recents.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#090f17",
    theme_color: "#090f17",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" }
  });
}
