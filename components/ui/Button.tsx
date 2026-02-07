import Link from "next/link";
import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  className?: string;
};

const baseStyles =
  "inline-flex items-center justify-center rounded-md bg-secondary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-amber-400";

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
