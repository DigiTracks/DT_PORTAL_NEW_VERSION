export function GET() {
  return new Response(JSON.stringify({
    name: "LearnPMO by DigiTracks",
    short_name: "LearnPMO",
    description: "Public project delivery guides and authorised workspace routes.",
    start_url: "/dashboard/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf2dc",
    theme_color: "#fbf2dc",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  }), { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } });
}
