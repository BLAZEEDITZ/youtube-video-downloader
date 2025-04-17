"use server"

import ytdl from "ytdl-core"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"
import { existsSync } from "fs"

export async function downloadVideo(url: string) {
  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return { error: "Invalid YouTube URL" }
    }

    // Get video info
    const info = await ytdl.getInfo(url)
    const videoTitle = info.videoDetails.title
    const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, "")

    // Create downloads directory if it doesn't exist
    const downloadDir = join(process.cwd(), "public", "downloads")
    if (!existsSync(downloadDir)) {
      await mkdir(downloadDir, { recursive: true })
    }

    // Set file path
    const fileName = `${sanitizedTitle}-${Date.now()}.mp4`
    const filePath = join(downloadDir, fileName)
    const publicPath = `/downloads/${fileName}`

    // Get highest quality format
    const format = ytdl.chooseFormat(info.formats, { quality: "highest" })

    // Download the video
    const videoStream = ytdl(url, { format: format })

    // Create a buffer from the stream
    const chunks: Buffer[] = []
    for await (const chunk of videoStream) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)

    // Write the buffer to a file
    await writeFile(filePath, buffer)

    return {
      downloadUrl: publicPath,
      title: videoTitle,
    }
  } catch (error) {
    console.error("Error downloading video:", error)
    return { error: "Failed to download video. Please try again." }
  }
}
