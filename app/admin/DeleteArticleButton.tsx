"use client";

export default function DeleteArticleButton({ id }: { id: string }) {
  return (
    <button
      className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 hover:bg-red-500/20 transition text-sm"
      onClick={async () => {
        const ok = confirm("Delete this article?");
        if (!ok) return;

        const res = await fetch(`/api/articles/id/${id}`, { method: "DELETE" });
        if (res.ok) {
          // simplest refresh
          location.reload();
        } else {
          const json = await res.json().catch(() => ({}));
          alert(json?.error || "Delete failed");
        }
      }}
    >
      Delete
    </button>
  );
}
