import { type NextRequest, NextResponse } from "next/server"
import ytdl from "ytdl-core"

export const runtime = "nodejs"
export const maxDuration = 30 // This extends the function timeout to 30 seconds

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

    // Get video info with additional options to bypass restrictions
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          // Add user-agent to mimic a browser request
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          // Add cookie if available (this would be better with actual cookies)
          Cookie: "CONSENT=YES+cb; YSC=DwKYllHNwuw; VISITOR_INFO1_LIVE=y-VjbJEOTHw;",
        },
      },
    })

    // Extract relevant information
    const videoDetails = {
      title: info.videoDetails.title,
      description: info.videoDetails.shortDescription,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      duration: info.videoDetails.lengthSeconds,
      author: info.videoDetails.author.name,
      viewCount: info.videoDetails.viewCount,
      formats: info.formats
        .filter((format) => {
          // Filter out formats without audio or video
          return format.hasAudio || format.hasVideo
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

    // Provide more detailed error information
    let errorMessage = error.message || "Failed to fetch video information"

    // Check for specific ytdl-core errors
    if (errorMessage.includes("Status code: 410")) {
      errorMessage = "YouTube has blocked this request. This may be temporary - please try again later."
    } else if (errorMessage.includes("No video id found")) {
      errorMessage = "Invalid YouTube URL. Please check the URL and try again."
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
