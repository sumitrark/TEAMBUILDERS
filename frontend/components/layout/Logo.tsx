import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold">
        T
      </div>

      <span className="text-xl font-bold">
        TEAMBUILDERS
      </span>
    </Link>
  );
}