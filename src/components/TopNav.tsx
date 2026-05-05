import { Link } from "react-router-dom";

export default function TopNav() {
  return (
    <nav className="h-[72px] bg-[#f5f5f5] flex items-center px-5 gap-6 shrink-0">
      <a
        href="https://learn.thinkcerca.com/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="ThinkCERCA – go to learn.thinkcerca.com"
        className="flex items-center"
      >
        <img src="/Logo.svg" alt="ThinkCERCA" className="h-8 w-8" />
      </a>
      <Link
        to="/"
        className="text-[14px] font-medium text-[#4a4a4a] hover:text-[#1e6fd4] transition-colors"
      >
        Module Plan Home
      </Link>
    </nav>
  );
}
