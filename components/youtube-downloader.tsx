"use client"

import type React from "react"

import { useState } from "react"
import { Youtube, Download, FileType, Music, Video, Loader2, Info, Clock, Eye, User, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface VideoInfo {
  title: string
  description?: string
  thumbnail: string
  duration?: string
  author?: string
  viewCount?: string
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
  const { toast } = useToast()

  // Format seconds to minutes:seconds
  const formatDuration = (seconds?: string) => {
    if (!seconds) return "Unknown duration"
    const totalSeconds = Number.parseInt(seconds)
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Format view count with commas
  const formatViewCount = (count?: string) => {
    if (!count) return "Unknown views"
    return Number.parseInt(count).toLocaleString() + " views"
  }

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

      // Auto-select the highest quality format with both video and audio
      const bestFormat = data.formats
        .filter((f) => f.hasVideo && f.hasAudio)
        .sort((a, b) => {
          const aHeight = a.qualityLabel ? Number.parseInt(a.qualityLabel) : 0
          const bHeight = b.qualityLabel ? Number.parseInt(b.qualityLabel) : 0
          return bHeight - aHeight
        })[0]

      if (bestFormat) {
        setSelectedFormat(bestFormat.itag)
      }

      toast({
        title: "Video information retrieved",
        description: "Select a format to download the video",
      })
    } catch (err: any) {
      setError(err.message || "An error occurred while processing your request")
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to fetch video information",
      })
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

    toast({
      title: "Download started",
      description: "Your download should begin shortly",
    })
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
    <div className="w-full max-w-4xl mx-auto p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="overflow-hidden border-2 border-red-100 dark:border-red-900/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 5,
                }}
              >
                <Youtube className="h-16 w-16" />
              </motion.div>
            </div>
            <CardTitle className="text-3xl font-bold text-center">YouTube Video Downloader</CardTitle>
            <CardDescription className="text-center text-white/80 text-lg">
              Download videos from YouTube in various formats
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pr-10 border-2 focus:border-red-500 h-12 text-base"
                  />
                  <Youtube className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 h-12 px-6 text-base font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      Get Info
                    </span>
                  )}
                </Button>
              </div>
            </form>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive" className="mt-4 border-2 border-red-200">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {videoInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <div className="rounded-md overflow-hidden shadow-md border border-gray-200 dark:border-gray-800">
                        <img
                          src={videoInfo.thumbnail || "/placeholder.svg"}
                          alt={videoInfo.title}
                          className="w-full h-auto object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=200&width=320"
                          }}
                        />
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatDuration(videoInfo.duration)}</span>
                        </div>

                        {videoInfo.author && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <User className="h-4 w-4 mr-1" />
                            <span>{videoInfo.author}</span>
                          </div>
                        )}

                        {videoInfo.viewCount && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Eye className="h-4 w-4 mr-1" />
                            <span>{formatViewCount(videoInfo.viewCount)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <h3 className="font-bold text-xl line-clamp-2">{videoInfo.title}</h3>

                      {videoInfo.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{videoInfo.description}</p>
                      )}

                      <div className="space-y-3">
                        <h4 className="font-medium text-base">Select a format to download:</h4>

                        <div className="max-h-60 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                          {/* Video with Audio formats */}
                          {videoInfo.formats.filter((f) => f.hasVideo && f.hasAudio).length > 0 && (
                            <div>
                              <Badge
                                variant="outline"
                                className="mb-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                              >
                                Video with Audio
                              </Badge>
                              <div className="space-y-2">
                                {videoInfo.formats
                                  .filter((f) => f.hasVideo && f.hasAudio)
                                  .map((format) => (
                                    <motion.div
                                      key={format.itag}
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.99 }}
                                      className={cn(
                                        "flex items-center justify-between p-3 border rounded-md cursor-pointer transition-all",
                                        selectedFormat === format.itag
                                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm"
                                          : "hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/10",
                                      )}
                                      onClick={() => setSelectedFormat(format.itag)}
                                    >
                                      <div className="flex items-center space-x-2">
                                        {getFormatIcon(format)}
                                        <div>
                                          <div className="font-medium text-sm">{format.mimeType.split(";")[0]}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {getFormatDescription(format)}
                                          </div>
                                        </div>
                                      </div>
                                      <Download
                                        className={cn(
                                          "h-4 w-4 transition-colors",
                                          selectedFormat === format.itag ? "text-red-500" : "text-muted-foreground",
                                        )}
                                      />
                                    </motion.div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Video Only formats */}
                          {videoInfo.formats.filter((f) => f.hasVideo && !f.hasAudio).length > 0 && (
                            <div>
                              <Badge
                                variant="outline"
                                className="mb-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                              >
                                Video Only
                              </Badge>
                              <div className="space-y-2">
                                {videoInfo.formats
                                  .filter((f) => f.hasVideo && !f.hasAudio)
                                  .map((format) => (
                                    <motion.div
                                      key={format.itag}
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.99 }}
                                      className={cn(
                                        "flex items-center justify-between p-3 border rounded-md cursor-pointer transition-all",
                                        selectedFormat === format.itag
                                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm"
                                          : "hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/10",
                                      )}
                                      onClick={() => setSelectedFormat(format.itag)}
                                    >
                                      <div className="flex items-center space-x-2">
                                        {getFormatIcon(format)}
                                        <div>
                                          <div className="font-medium text-sm">{format.mimeType.split(";")[0]}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {getFormatDescription(format)}
                                          </div>
                                        </div>
                                      </div>
                                      <Download
                                        className={cn(
                                          "h-4 w-4 transition-colors",
                                          selectedFormat === format.itag ? "text-red-500" : "text-muted-foreground",
                                        )}
                                      />
                                    </motion.div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Audio Only formats */}
                          {videoInfo.formats.filter((f) => !f.hasVideo && f.hasAudio).length > 0 && (
                            <div>
                              <Badge
                                variant="outline"
                                className="mb-2 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
                              >
                                Audio Only
                              </Badge>
                              <div className="space-y-2">
                                {videoInfo.formats
                                  .filter((f) => !f.hasVideo && f.hasAudio)
                                  .map((format) => (
                                    <motion.div
                                      key={format.itag}
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.99 }}
                                      className={cn(
                                        "flex items-center justify-between p-3 border rounded-md cursor-pointer transition-all",
                                        selectedFormat === format.itag
                                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm"
                                          : "hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/10",
                                      )}
                                      onClick={() => setSelectedFormat(format.itag)}
                                    >
                                      <div className="flex items-center space-x-2">
                                        {getFormatIcon(format)}
                                        <div>
                                          <div className="font-medium text-sm">{format.mimeType.split(";")[0]}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {getFormatDescription(format)}
                                          </div>
                                        </div>
                                      </div>
                                      <Download
                                        className={cn(
                                          "h-4 w-4 transition-colors",
                                          selectedFormat === format.itag ? "text-red-500" : "text-muted-foreground",
                                        )}
                                      />
                                    </motion.div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Button
                          onClick={handleDownload}
                          disabled={!selectedFormat}
                          className="w-full bg-green-600 hover:bg-green-700 mt-4 h-12 text-base font-medium"
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Download Now
                        </Button>
                      </motion.div>

                      <AnimatePresence>
                        {downloadStarted && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Alert className="mt-2 bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                              <AlertDescription>
                                Download started! If it doesn't begin automatically, check your browser's download
                                settings.
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="bg-gray-50 dark:bg-gray-900/50 p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="w-full">
              For educational purposes only. Please respect copyright laws and YouTube's Terms of Service.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
