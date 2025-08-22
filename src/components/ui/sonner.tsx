import { useEffect, useMemo, useState } from "react"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const getTheme = () => {
    if (typeof document !== "undefined") {
      if (document.documentElement.classList.contains("dark")) return "dark"
    }
    if (typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }
    return "light"
  }

  const [theme, setTheme] = useState<ToasterProps["theme"]>(getTheme())

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onMedia = () => setTheme(getTheme())
    if (mq && mq.addEventListener) mq.addEventListener("change", onMedia)

    const observer = new MutationObserver(() => setTheme(getTheme()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => {
      if (mq && mq.removeEventListener) mq.removeEventListener("change", onMedia)
      observer.disconnect()
    }
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
