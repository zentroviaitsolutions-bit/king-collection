export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="aspect-[4/5] animate-pulse rounded-2xl bg-black/10" />
      <div className="mt-4 h-5 animate-pulse rounded bg-black/10" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-black/10" />
      <div className="mt-4 h-10 animate-pulse rounded-full bg-black/10" />
    </div>
  );
}