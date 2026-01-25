export const metadata = {
  title: "About KnotShorts | Independent News & Analysis",
  description:
    "Learn about KnotShorts, our editorial mission, and our commitment to independent, factual journalism covering India and the world.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">About KnotShorts</h1>

      <p className="mb-4">
        KnotShorts is an independent digital news platform focused on delivering
        fast, factual, and readable news for a global audience, with a strong
        emphasis on India and international affairs.
      </p>

      <p className="mb-4">
        Our coverage spans geopolitics, business, technology, defense,
        environment, and major global developments that shape public discourse.
      </p>

      <p className="mb-4">
        KnotShorts operates with editorial independence and does not represent
        the views of any government, political party, or corporate entity.
      </p>

      <p>
        Our mission is simple: explain complex news clearly, responsibly, and
        without sensationalism.
      </p>
    </main>
  );
}
