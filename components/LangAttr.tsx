'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/* Single root layout means the static shell says lang="en" everywhere;
   this corrects it to zh on /zh/* after hydration (accepted trade-off in
   the spec). */
export default function LangAttr() {
  const pathname = usePathname()
  useEffect(() => {
    const zh = pathname === '/zh' || pathname.startsWith('/zh/')
    document.documentElement.lang = zh ? 'zh' : 'en'
  }, [pathname])
  return null
}
