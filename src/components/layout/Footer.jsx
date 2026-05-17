const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/10 bg-white/70 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div>
          <p className="font-serif text-2xl font-bold tracking-[0.08em]">KING</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-black/65">
            Premium fashion with a cleaner, more elevated shopping experience
            across discovery, checkout, and order tracking.
          </p>
        </div>

        <div className="text-left text-sm text-black/65 md:text-right">
          <p>Collections, orders, and account flows tuned for a smoother feel.</p>
          <p className="mt-2">
            © {currentYear} King Collection. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
