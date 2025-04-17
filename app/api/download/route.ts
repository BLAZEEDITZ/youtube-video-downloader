import type { NextRequest } from "next/server"
import ytdl from "ytdl-core"
import { Readable } from "stream"

export const runtime = "nodejs"
export const maxDuration = 60 // This extends the function timeout to 60 seconds

export async function GET(request: NextRequest) {
  try {
    // Get the URL and itag from the query parameters
    const url = request.nextUrl.searchParams.get("url")
    const itag = request.nextUrl.searchParams.get("itag")

    if (!url || !itag) {
      return new Response("URL and itag are required", { status: 400 })
    }

    if (!ytdl.validateURL(url)) {
      return new Response("Invalid YouTube URL", { status: 400 })
    }

    // Get video info with additional options to bypass restrictions
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Cookie: "CONSENT=YES+cb; YSC=DwKYllHNwuw; VISITOR_INFO1_LIVE=y-VjbJEOTHw;",
        },
      },
    })

    // Find the format with the specified itag
    const format = ytdl.chooseFormat(info.formats, { quality: itag })

    if (!format) {
      return new Response("Format not found", { status: 400 })
    }

    // Sanitize the title for use in the filename
    const sanitizedTitle = info.videoDetails.title
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "_")
      .substring(0, 100)

    // Determine the file extension based on the container
    const fileExtension = format.container || "mp4"

    // Create a readable stream for the video with higher quality options
    const videoStream = ytdl(url, {
      format: format,
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    })

    // Convert the stream to a Response
    const headers = new Headers({
      "Content-Disposition": `attachment; filename="${sanitizedTitle}.${fileExtension}"`,
      "Content-Type": format.mimeType || "application/octet-stream",
    })

    // Return the stream as a response
    return new Response(Readable.fromWeb(videoStream as any), { headers })
  } catch (error: any) {
    console.error("Error downloading video:", error)

    // Provide more detailed error information
    let errorMessage = error.message || "Failed to download video"

    if (errorMessage.includes("Status code: 410")) {
      errorMessage = "YouTube has blocked this download request. This may be temporary - please try again later."
    }

    return new Response(errorMessage, { status: 500 })
  }
}
