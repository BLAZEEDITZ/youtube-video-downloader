"use client"

import YouTubeDownloader from "@/components/youtube-downloader"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <YouTubeDownloader />
      <Toaster />
    </main>
  )
}
