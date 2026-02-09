"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Upload, FileText, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTranslation } from 'react-i18next'
import { cn } from "@/lib/utils"

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const { t, i18n } = useTranslation()
  
  const navItems = [
    {
      name: t('nav.home'),
      href: "/~",
      icon: Upload,
    },
    {
      name: t('nav.docs'),
      href: "/docs",
      icon: FileText,
    },
  ]
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    const newPath = pathname.replace(/^\/(en|id)/, `/${lng}`)
    window.history.replaceState(null, '', newPath)
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600" />
              <div className="absolute inset-0.5 rounded-md bg-white flex items-center justify-center">
                <span className="text-lg font-bold gradient-text">K</span>
              </div>
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:inline-block">
              Kabox CDN
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-lg border px-3 py-1.5">
            <Globe className="h-4 w-4" />
            <select
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value="en">English</option>
              <option value="id">Indonesia</option>
            </select>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-2">
                    <div className="relative h-8 w-8">
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600" />
                      <div className="absolute inset-0.5 rounded-md bg-white flex items-center justify-center">
                        <span className="text-lg font-bold gradient-text">K</span>
                      </div>
                    </div>
                    <span className="text-xl font-bold gradient-text">
                      Kabox CDN
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
                
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <Globe className="h-4 w-4" />
                  <select
                    value={i18n.language}
                    onChange={(e) => {
                      changeLanguage(e.target.value)
                      setIsOpen(false)
                    }}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="id">Indonesia</option>
                  </select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}