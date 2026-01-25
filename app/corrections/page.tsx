export const metadata = {
  title: "Corrections Policy | KnotShorts",
  description:
    "How KnotShorts handles corrections, clarifications, and updates.",
};

export default function CorrectionsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">Corrections Policy</h1>

      <p className="mb-4">
        KnotShorts is committed to accuracy. If we make a mistake, we correct it.
      </p>

      <p className="mb-4">
        Readers may report errors by emailing{" "}
        <a
          href="mailto:knotshorts1@gmail.com"
          className="underline text-blue-400"
        >
          knotshorts1@gmail.com
        </a>
        .
      </p>

      <p>
        Corrections are made transparently, and significant updates are noted
        within the article where appropriate.
      </p>
    </main>
  );
}
