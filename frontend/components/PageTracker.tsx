"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { logEvent } from "@/lib/api"

export default function PageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const sp = searchParams?.toString()
    logEvent("page_view", { pathname, search: sp })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  return null
}
