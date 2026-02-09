import Link from "next/link"
import { Github, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()
  
  return (
    <footer className="mt-auto border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('footer.created_by')}</span>
            <Link
              href="https://akadev.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              aka
            </Link>
            <span className="text-sm text-muted-foreground">{t('footer.with_love')}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-8 w-8"
          >
            <Link
              href="https://t.me/annountandmonitkabox"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Telegram</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-8 w-8"
          >
            <Link
              href="https://github.com/akaanakbaik"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="container mt-6 border-t pt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{t('footer.about')}</h4>
            <p className="text-xs text-muted-foreground">
              {t('footer.about_description')}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{t('footer.features')}</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• {t('footer.feature_secure')}</li>
              <li>• {t('footer.feature_fast')}</li>
              <li>• {t('footer.feature_multi_db')}</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{t('footer.support')}</h4>
            <p className="text-xs text-muted-foreground">
              {t('footer.support_description')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}