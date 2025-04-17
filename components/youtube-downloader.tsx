"use client"

import type React from "react"

import { useState } from "react"
import { Youtube, Download, FileType, Music, Video, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface VideoInfo {
  title: string
  thumbnail: string
  formats: VideoFormat[]
}

interface VideoFormat {
  itag: number
  mimeType: string
  qualityLabel?: string
  audioQuality?: string
  hasVideo: boolean
  hasAudio: boolean
  container: string
  codecs: string
  contentLength?: string
  bitrate?: number
}

export default function YouTubeDownloader() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null)
  const [downloadStarted, setDownloadStarted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url) {
      setError("Please enter a YouTube URL")
      return
    }

    try {
      setIsLoading(true)
      setError("")
      setVideoInfo(null)
      setSelectedFormat(null)
      setDownloadStarted(false)

      const response = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch video information")
      }

      const data = await response.json()
      setVideoInfo(data)
    } catch (err: any) {
      setError(err.message || "An error occurred while processing your request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!selectedFormat) return

    setDownloadStarted(true)

    // Create the download URL
    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&itag=${selectedFormat}`

    // Open the download URL in a new tab
    window.open(downloadUrl, "_blank")
  }

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "Unknown size"
    const size = Number.parseInt(bytes)
    if (isNaN(size)) return "Unknown size"

    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    if (size === 0) return "0 Byte"
    const i = Number.parseInt(Math.floor(Math.log(size) / Math.log(1024)).toString())
    return Math.round(size / Math.pow(1024, i)) + " " + sizes[i]
  }

  const getFormatIcon = (format: VideoFormat) => {
    if (format.hasVideo && format.hasAudio) return <Video className="h-4 w-4" />
    if (format.hasVideo) return <FileType className="h-4 w-4" />
    if (format.hasAudio) return <Music className="h-4 w-4" />
    return <FileType className="h-4 w-4" />
  }

  const getFormatDescription = (format: VideoFormat) => {
    const description = []

    if (format.hasVideo && format.qualityLabel) {
      description.push(format.qualityLabel)
    }

    if (format.hasAudio && format.audioQuality) {
      description.push(`Audio: ${format.audioQuality.replace("AUDIO_QUALITY_", "")}`)
    }

    if (format.contentLength) {
      description.push(formatFileSize(format.contentLength))
    }

    if (format.container) {
      description.push(`.${format.container}`)
    }

    return description.join(" | ")
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <Youtube className="h-12 w-12 text-red-600" />
        </div>
        <CardTitle className="text-2xl text-center">YouTube Video Downloader</CardTitle>
        <CardDescription className="text-center">Enter a YouTube URL to download the video</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                <Youtube className="mr-2 h-4 w-4" />
                Get Video Info
              </span>
            )}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {videoInfo && (
          <div className="mt-6 space-y-4">
            <div className="rounded-md overflow-hidden">
              <img
                src={videoInfo.thumbnail || "/placeholder.svg"}
                alt={videoInfo.title}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=200&width=320"
                }}
              />
            </div>

            <h3 className="font-medium text-lg line-clamp-2">{videoInfo.title}</h3>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Select a format to download:</h4>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {/* Video with Audio formats */}
                {videoInfo.formats.filter((f) => f.hasVideo && f.hasAudio).length > 0 && (
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Video with Audio
                    </Badge>
                    {videoInfo.formats
                      .filter((f) => f.hasVideo && f.hasAudio)
                      .map((format) => (
                        <div
                          key={format.itag}
                          className={cn(
                            "flex items-center justify-between p-3 border rounded-md cursor-pointer hover:border-primary hover:bg-accent transition-colors",
                            selectedFormat === format.itag && "border-primary bg-accent",
                          )}
                          onClick={() => setSelectedFormat(format.itag)}
                        >
                          <div className="flex items-center space-x-2">
                            {getFormatIcon(format)}
                            <div>
                              <div className="font-medium text-sm">{format.mimeType.split(";")[0]}</div>
                              <div className="text-xs text-muted-foreground">{getFormatDescription(format)}</div>
                            </div>
                          </div>
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                  </div>
                )}

                {/* Video Only formats */}
                {videoInfo.formats.filter((f) => f.hasVideo && !f.hasAudio).length > 0 && (
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Video Only
                    </Badge>
                    {videoInfo.formats
                      .filter((f) => f.hasVideo && !f.hasAudio)
                      .map((format) => (
                        <div
                          key={format.itag}
                          className={cn(
                            "flex items-center justify-between p-3 border rounded-md cursor-pointer hover:border-primary hover:bg-accent transition-colors",
                            selectedFormat === format.itag && "border-primary bg-accent",
                          )}
                          onClick={() => setSelectedFormat(format.itag)}
                        >
                          <div className="flex items-center space-x-2">
                            {getFormatIcon(format)}
                            <div>
                              <div className="font-medium text-sm">{format.mimeType.split(";")[0]}</div>
                              <div className="text-xs text-muted-foreground">{getFormatDescription(format)}</div>
                            </div>
                          </div>
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                  </div>
                )}

                {/* Audio Only formats */}
                {videoInfo.formats.filter((f) => !f.hasVideo && f.hasAudio).length > 0 && (
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Audio Only
                    </Badge>
                    {videoInfo.formats
                      .filter((f) => !f.hasVideo && f.hasAudio)
                      .map((format) => (
                        <div
                          key={format.itag}
                          className={cn(
                            "flex items-center justify-between p-3 border rounded-md cursor-pointer hover:border-primary hover:bg-accent transition-colors",
                            selectedFormat === format.itag && "border-primary bg-accent",
                          )}
                          onClick={() => setSelectedFormat(format.itag)}
                        >
                          <div className="flex items-center space-x-2">
                            {getFormatIcon(format)}
                            <div>
                              <div className="font-medium text-sm">{format.mimeType.split(";")[0]}</div>
                              <div className="text-xs text-muted-foreground">{getFormatDescription(format)}</div>
                            </div>
                          </div>
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleDownload}
              disabled={!selectedFormat}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>

            {downloadStarted && (
              <Alert className="mt-2 bg-green-50 text-green-800 border-green-200">
                <AlertDescription>
                  Download started! If it doesn't begin automatically, check your browser's download settings.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-muted-foreground">
        For educational purposes only. Please respect copyright laws.
      </CardFooter>
    </Card>
  )
}
