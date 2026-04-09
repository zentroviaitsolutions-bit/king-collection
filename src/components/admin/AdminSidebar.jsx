"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/banners", label: "Banners" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="px-3 py-2 text-xl font-bold">Admin Panel</h2>

      <nav className="mt-4 space-y-2">
        {links.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active ? "bg-black text-white" : "hover:bg-black/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}