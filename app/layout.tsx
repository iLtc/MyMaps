import type { Metadata } from 'next'
import { Noto_Serif_SC, Source_Serif_4 } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import LangAttr from '@/components/LangAttr'
import '@/styles/broadsheet.css'
import '@/styles/base.css'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif'
})

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '600'],
  variable: '--font-noto-serif-sc',
  preload: false
})

export const metadata: Metadata = {
  title: 'My Maps',
  description: 'Places I have been'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${notoSerifSC.variable}`}>
      <body>
        <LangAttr />
        {children}
      </body>
      <GoogleAnalytics gaId="G-ZJY9VYC238" />
    </html>
  )
}
