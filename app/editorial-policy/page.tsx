export const metadata = {
  title: "Editorial Policy | KnotShorts",
  description:
    "Read KnotShorts editorial standards, sourcing practices, and commitment to accuracy.",
};

export default function EditorialPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">Editorial Policy</h1>

      <p className="mb-4">
        KnotShorts follows strict editorial standards to ensure accuracy,
        fairness, and transparency in reporting.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Sourcing</h2>
      <p className="mb-4">
        We rely on verified sources, official statements, primary reporting, and
        credible international media. Anonymous sources are used sparingly and
        only when necessary.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Corrections</h2>
      <p className="mb-4">
        If an error is identified, we correct it promptly and transparently.
        Significant corrections are noted within the article.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Opinion vs News</h2>
      <p>
        Opinion content, if published, is clearly labeled. News reporting is
        factual and neutral.
      </p>
    </main>
  );
}
