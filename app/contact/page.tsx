export const metadata = {
  title: "Contact KnotShorts",
  description:
    "Contact KnotShorts for editorial inquiries, corrections, or general questions.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>

      <p className="mb-4">
        For editorial inquiries, corrections, or general communication, you can
        reach us at:
      </p>

      <p className="mb-2">
        <strong>Email:</strong>{" "}
        <a
          href="mailto:knotshorts1@gmail.com"
          className="underline text-blue-400"
        >
          knotshorts1@gmail.com
        </a>
      </p>

      <p className="mb-4">
        KnotShorts operates primarily online and serves a global readership with
        a base in India.
      </p>

      <p>
        We aim to respond to all legitimate inquiries within a reasonable time.
      </p>
    </main>
  );
}
