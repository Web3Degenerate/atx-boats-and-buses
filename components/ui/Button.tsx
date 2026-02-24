import Link from "next/link";
import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  className?: string;
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-neutral-200 transition-colors";

export default function Button({ children, href, className = "" }: ButtonProps) {
  if (href) {
    return (
      <Link href={href} className={`${baseStyles} ${className}`.trim()}>
        {children}
      </Link>
    );
  }

  return <button className={`${baseStyles} ${className}`.trim()}>{children}</button>;
}
