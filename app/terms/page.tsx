// app/terms/page.tsx
import Link from "next/link";

export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-white">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
        Terms of Service
      </h1>

      <p className="mt-4 text-white/70 leading-relaxed">
        These Terms govern use of KnotShorts. By accessing the site, you agree to
        comply with these Terms. If you do not agree, please discontinue use.
      </p>

      <section className="mt-8 space-y-6 text-white/70 leading-relaxed">
        <div>
          <h2 className="text-white text-xl font-bold">1. Content</h2>
          <p className="mt-2">
            KnotShorts publishes news and information for general purposes. We
            may update, modify, or remove content at any time.
          </p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold">2. Intellectual Property</h2>
          <p className="mt-2">
            Unless stated otherwise, site content (text, layout, branding) is
            owned by KnotShorts and may not be reused commercially without
            permission.
          </p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold">3. User Conduct</h2>
          <p className="mt-2">
            You agree not to misuse the site, attempt unauthorized access, or
            disrupt service availability.
          </p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold">4. Third-Party Links</h2>
          <p className="mt-2">
            We may link to third-party sites. KnotShorts is not responsible for
            third-party content or policies.
          </p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold">5. Disclaimer</h2>
          <p className="mt-2">
            Content is provided “as is” without warranties. We do not guarantee
            completeness or accuracy in all cases.
          </p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold">6. Contact</h2>
          <p className="mt-2">
            For questions, use the{" "}
            <Link href="/contact" className="text-sky-300 hover:underline">
              contact page
            </Link>
            .
          </p>
        </div>
      </section>

      <p className="mt-10 text-xs text-white/45">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </main>
  );
}
