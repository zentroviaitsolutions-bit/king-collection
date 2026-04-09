export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 text-center text-sm text-black/70">
        © {new Date().getFullYear()} King Collection. All rights reserved.
      </div>
    </footer>
  );
}