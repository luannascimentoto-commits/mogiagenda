import { useEffect, useRef } from 'react'

interface Props {
  siteKey: string
  onToken: (token: string) => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: any) => string
      reset: (widgetId: string) => void
    }
  }
}

export function Turnstile({ siteKey, onToken }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey) return
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      if (ref.current && window.turnstile) {
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
        })
      }
    }

    return () => {
      document.head.removeChild(script)
    }
  }, [siteKey, onToken])

  return <div ref={ref} />
}