"use client";

import Link from "next/link";

import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

import { navigation } from "@/constants/navigation";
import Container from "@/components/common/Container";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="text-sm font-medium transition hover:text-violet-600"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button className="hidden rounded-full border px-5 py-2 md:block">
            Login
          </button>

          <button className="rounded-full bg-violet-600 px-5 py-2 text-white transition hover:bg-violet-700">
            Get Started
          </button>
        </div>
      </Container>
    </header>
  );
}