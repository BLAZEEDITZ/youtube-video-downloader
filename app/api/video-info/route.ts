import { type NextRequest, NextResponse } from "next/server"
import ytdl from "ytdl-core"

export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameters
    const url = request.nextUrl.searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (!ytdl.validateURL(url)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
    }

    // Get video info
    const info = await ytdl.getInfo(url)

    // Extract relevant information
    const videoDetails = {
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      formats: info.formats
        .filter((format) => {
          // Filter out formats without audio or video, and formats with unknown content length
          return (format.hasAudio || format.hasVideo) && (format.contentLength || format.approxDurationMs)
        })
        .map((format) => ({
          itag: format.itag,
          mimeType: format.mimeType || "unknown/unknown",
          qualityLabel: format.qualityLabel,
          audioQuality: format.audioQuality,
          hasVideo: format.hasVideo,
          hasAudio: format.hasAudio,
          container: format.container,
          codecs: format.codecs,
          contentLength: format.contentLength,
          bitrate: format.bitrate,
        })),
    }

    return NextResponse.json(videoDetails)
  } catch (error: any) {
    console.error("Error fetching video info:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch video information" }, { status: 500 })
  }
}
