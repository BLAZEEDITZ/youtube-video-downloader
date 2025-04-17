import type { NextRequest } from "next/server"
import ytdl from "ytdl-core"
import { Readable } from "stream"

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

    // Get video info
    const info = await ytdl.getInfo(url)

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

    // Create a readable stream for the video
    const videoStream = ytdl(url, { format })

    // Convert the stream to a Response
    const headers = new Headers({
      "Content-Disposition": `attachment; filename="${sanitizedTitle}.${fileExtension}"`,
      "Content-Type": format.mimeType || "application/octet-stream",
    })

    // Return the stream as a response
    return new Response(Readable.fromWeb(videoStream as any), { headers })
  } catch (error: any) {
    console.error("Error downloading video:", error)
    return new Response(error.message || "Failed to download video", { status: 500 })
  }
}
