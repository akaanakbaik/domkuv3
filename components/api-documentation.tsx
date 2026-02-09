"use client"

import * as React from "react"
import { Copy, Check, ExternalLink, Code, Terminal, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from 'react-i18next'
import { cn } from "@/lib/utils"

export function ApiDocumentation() {
  const [copied, setCopied] = React.useState<string | null>(null)
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
      toast({
        title: t('docs.copied'),
        description: t('docs.copied_description'),
      })
    } catch (error) {
      toast({
        title: t('docs.copy_failed'),
        description: t('docs.copy_failed_description'),
        variant: "destructive",
      })
    }
  }
  
  const endpoints = [
    {
      id: "upload",
      title: t('docs.endpoints.upload.title'),
      description: t('docs.endpoints.upload.description'),
      method: "POST",
      path: "/api/upload",
      curl: `curl -X POST https://kabox.my.id/api/upload \\
  -F "file=@yourfile.jpg" \\
  -H "Content-Type: multipart/form-data"`,
      response: `{
  "success": true,
  "data": {
    "id": "abc123",
    "filename": "yourfile.jpg",
    "size": 123456,
    "mimeType": "image/jpeg",
    "url": "https://kabox.my.id/files/abc123.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}`,
    },
    {
      id: "status",
      title: t('docs.endpoints.status.title'),
      description: t('docs.endpoints.status.description'),
      method: "GET",
      path: "/api/files/:id/status",
      curl: `curl https://kabox.my.id/api/files/abc123/status`,
      response: `{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "file.pdf",
    "size": 1048576,
    "status": "completed",
    "message": "Upload completed",
    "chunked": false,
    "chunkCount": 0,
    "downloadUrl": "https://kabox.my.id/files/abc123/download"
  }
}`,
    },
    {
      id: "info",
      title: t('docs.endpoints.info.title'),
      description: t('docs.endpoints.info.description'),
      method: "GET",
      path: "/api/files/:id",
      curl: `curl https://kabox.my.id/api/files/abc123`,
      response: `{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "file.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "chunked": false,
    "chunkCount": 0,
    "checksum": "sha256...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "downloadUrl": "https://kabox.my.id/files/abc123/download",
    "downloads": 42
  }
}`,
    },
    {
      id: "download",
      title: t('docs.endpoints.download.title'),
      description: t('docs.endpoints.download.description'),
      method: "GET",
      path: "/api/files/:id/download",
      curl: `curl -OJ https://kabox.my.id/api/files/abc123/download`,
      response: `Binary file stream with headers:
Content-Type: application/pdf
Content-Disposition: attachment; filename="file.pdf"
Content-Length: 1048576`,
    },
  ]
  
  const errorCodes = [
    { code: "400", description: t('docs.errors.bad_request') },
    { code: "401", description: t('docs.errors.unauthorized') },
    { code: "403", description: t('docs.errors.forbidden') },
    { code: "404", description: t('docs.errors.not_found') },
    { code: "413", description: t('docs.errors.payload_too_large') },
    { code: "415", description: t('docs.errors.unsupported_media') },
    { code: "429", description: t('docs.errors.too_many_requests') },
    { code: "500", description: t('docs.errors.internal_server') },
  ]
  
  return (
    <div className="space-y-8">
      <section id="introduction">
        <h2 className="mb-4 text-2xl font-bold">{t('docs.introduction')}</h2>
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p>{t('docs.intro_content1')}</p>
          <p>{t('docs.intro_content2')}</p>
          <div className="my-6 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">{t('docs.important')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('docs.no_auth_required')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section id="authentication">
        <h2 className="mb-4 text-2xl font-bold">{t('docs.authentication')}</h2>
        <Card>
          <CardHeader>
            <CardTitle>{t('docs.no_auth_title')}</CardTitle>
            <CardDescription>
              {t('docs.no_auth_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4">
              <code className="text-sm">
                {t('docs.auth_example')}
              </code>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{t('docs.rate_limit_note')}</span>
            </div>
          </CardContent>
        </Card>
      </section>
      
      <section id="endpoints">
        <h2 className="mb-6 text-2xl font-bold">{t('docs.api_endpoints')}</h2>
        <div className="space-y-6">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id} id={endpoint.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "rounded-md px-2 py-1 text-xs font-semibold uppercase",
                        endpoint.method === "GET" 
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      )}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-medium">
                        {endpoint.path}
                      </code>
                    </div>
                    <CardTitle className="mt-2">{endpoint.title}</CardTitle>
                    <CardDescription>{endpoint.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="curl" className="w-full">
                  <TabsList>
                    <TabsTrigger value="curl" className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      cURL
                    </TabsTrigger>
                    <TabsTrigger value="response" className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      {t('docs.response')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="curl" className="mt-4">
                    <div className="relative rounded-lg bg-gray-900 p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 text-gray-300 hover:text-white"
                        onClick={() => copyToClipboard(endpoint.curl, `${endpoint.id}-curl`)}
                      >
                        {copied === `${endpoint.id}-curl` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <pre className="overflow-x-auto text-sm text-gray-100">
                        <code>{endpoint.curl}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  <TabsContent value="response" className="mt-4">
                    <div className="relative rounded-lg bg-gray-900 p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 text-gray-300 hover:text-white"
                        onClick={() => copyToClipboard(endpoint.response, `${endpoint.id}-response`)}
                      >
                        {copied === `${endpoint.id}-response` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <pre className="overflow-x-auto text-sm text-gray-100">
                        <code>{endpoint.response}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      <section id="rate-limits">
        <h2 className="mb-4 text-2xl font-bold">{t('docs.rate_limits')}</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold">{t('docs.default_limits')}</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>10 {t('docs.requests_per_second')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>1000 {t('docs.requests_per_day')}</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">{t('docs.headers')}</h4>
                <div className="rounded-lg bg-muted p-3">
                  <code className="block text-xs">
                    X-RateLimit-Limit: 10<br />
                    X-RateLimit-Remaining: 9<br />
                    X-RateLimit-Reset: 1625097600
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      <section id="errors">
        <h2 className="mb-4 text-2xl font-bold">{t('docs.error_codes')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {errorCodes.map((error) => (
            <Card key={error.code}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-destructive">
                    {error.code}
                  </span>
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {error.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      <section id="examples">
        <h2 className="mb-4 text-2xl font-bold">{t('docs.examples')}</h2>
        <Tabs defaultValue="javascript">
          <TabsList>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="php">PHP</TabsTrigger>
          </TabsList>
          <TabsContent value="javascript" className="mt-4">
            <div className="relative rounded-lg bg-gray-900 p-4">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 text-gray-300 hover:text-white"
                onClick={() => copyToClipboard(`const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('https://kabox.my.id/api/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.url);`, 'js-example')}
              >
                {copied === 'js-example' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <pre className="overflow-x-auto text-sm text-gray-100">
                <code>{`const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('https://kabox.my.id/api/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.url);`}</code>
              </pre>
            </div>
          </TabsContent>
          <TabsContent value="python" className="mt-4">
            <div className="relative rounded-lg bg-gray-900 p-4">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 text-gray-300 hover:text-white"
                onClick={() => copyToClipboard(`import requests

url = "https://kabox.my.id/api/upload"
files = {'file': open('yourfile.jpg', 'rb')}

response = requests.post(url, files=files)
data = response.json()

print(data['url'])`, 'py-example')}
              >
                {copied === 'py-example' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <pre className="overflow-x-auto text-sm text-gray-100">
                <code>{`import requests

url = "https://kabox.my.id/api/upload"
files = {'file': open('yourfile.jpg', 'rb')}

response = requests.post(url, files=files)
data = response.json()

print(data['url'])`}</code>
              </pre>
            </div>
          </TabsContent>
          <TabsContent value="php" className="mt-4">
            <div className="relative rounded-lg bg-gray-900 p-4">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 text-gray-300 hover:text-white"
                onClick={() => copyToClipboard(`<?php
$url = "https://kabox.my.id/api/upload";
$file = $_FILES['file'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['file' => new CURLFile($file['tmp_name'])]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
echo $data['url'];
?>`, 'php-example')}
              >
                {copied === 'php-example' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <pre className="overflow-x-auto text-sm text-gray-100">
                <code>{`<?php
$url = "https://kabox.my.id/api/upload";
$file = $_FILES['file'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['file' => new CURLFile($file['tmp_name'])]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
echo $data['url'];
?>`}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}