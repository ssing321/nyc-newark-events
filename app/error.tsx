"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => console.error(error), [error]);
  return <main className="detail-main"><div className="shell"><ErrorState /></div></main>;
}
