import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Uploader } from "@/components/uploader"
import { Stats } from "@/components/stats"
import { serverTranslation } from "@/lib/i18n-server"

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { t } = await serverTranslation(locale)
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t('hero.description')}
            </p>
          </div>
          
          <div className="mx-auto max-w-4xl">
            <Uploader />
            <Stats />
            
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border p-6">
                <h3 className="mb-4 text-xl font-semibold">
                  {t('how_it_works.title')}
                </h3>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                      1
                    </div>
                    <span>{t('how_it_works.step1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                      2
                    </div>
                    <span>{t('how_it_works.step2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                      3
                    </div>
                    <span>{t('how_it_works.step3')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                      4
                    </div>
                    <span>{t('how_it_works.step4')}</span>
                  </li>
                </ol>
              </div>
              
              <div className="rounded-xl border p-6">
                <h3 className="mb-4 text-xl font-semibold">
                  {t('features.title')}
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span>{t('features.list1')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>{t('features.list2')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span>{t('features.list3')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>{t('features.list4')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>{t('features.list5')}</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <h2 className="mb-4 text-2xl font-bold">
                {t('cta.title')}
              </h2>
              <p className="mb-6 text-muted-foreground">
                {t('cta.description')}
              </p>
              <div className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-6 py-3">
                <span className="text-sm font-medium">
                  {t('cta.example')}
                </span>
                <code className="rounded bg-background px-2 py-1 text-xs">
                  https://kabox.my.id/files/abc123.jpg
                </code>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}