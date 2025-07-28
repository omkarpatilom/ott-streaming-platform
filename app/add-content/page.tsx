"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { storageService } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

export default function AddContentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [contentType, setContentType] = useState<"movie" | "series">("movie")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [movieUrl, setMovieUrl] = useState("")
  const [seriesUrl, setSeriesUrl] = useState("")
  const [totalEpisodes, setTotalEpisodes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoParseEnabled, setAutoParseEnabled] = useState(true)
  const [parsedInfo, setParsedInfo] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  const checkMobile = () => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    setIsMobile(isMobileDevice)
  }

  React.useEffect(() => {
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const generateEpisodeUrls = (baseUrl: string, total: number): string[] => {
    const urls: string[] = []

    // Check if it matches our series pattern
    const parsed = parseVideoUrl(baseUrl)

    if (parsed) {
      // Generate URLs based on the detected pattern
      for (let i = 1; i <= total; i++) {
        const episodeNumber = `E${i.toString().padStart(2, "0")}`
        const episodeUrl = baseUrl.replace(
          new RegExp(`${parsed.season}${parsed.episode}`, "i"),
          `${parsed.season}${episodeNumber}`,
        )
        urls.push(episodeUrl)
      }
    } else {
      // Fallback to original logic
      for (let i = 1; i <= total; i++) {
        let episodeUrl = baseUrl
        const patterns = [/episode[-_]?\d+/gi, /ep[-_]?\d+/gi, /e\d+/gi, /\d+/g]

        let patternFound = false
        for (const pattern of patterns) {
          if (pattern.test(baseUrl)) {
            episodeUrl = baseUrl.replace(pattern, `episode${i}`)
            patternFound = true
            break
          }
        }

        if (!patternFound) {
          const separator = baseUrl.includes("?") ? "&" : "?"
          episodeUrl = `${baseUrl}${separator}episode=${i}`
        }

        urls.push(episodeUrl)
      }
    }

    return urls
  }

  const parseVideoUrl = (url: string) => {
    try {
      const filename = url.split("/").pop() || ""
      const patterns = [
        /^.*?-(.+?)\.S(\d+)E(\d+)\.(\d+p)\.(.+?)\.x(\d+)\.(.+?)\.mkv$/i,
        /^(.+?)\.S(\d+)E(\d+)\.(\d+p)\.(.+?)\.mkv$/i,
        /^(.+?)\.S(\d+)E(\d+)\.(\d+p)\.mkv$/i,
      ]

      for (const pattern of patterns) {
        const match = filename.match(pattern)
        if (match) {
          const [, seriesName, season, episode, quality, ...rest] = match

          const cleanSeriesName = seriesName.replace(/\./g, " ").replace(/[-_]/g, " ").replace(/\s+/g, " ").trim()

          const restInfo = rest.join(".")
          const languages = []
          if (/hindi/i.test(restInfo)) languages.push("Hindi")
          if (/eng/i.test(restInfo)) languages.push("English")

          const formats = []
          if (/x265/i.test(restInfo)) formats.push("x265")
          if (/10bit/i.test(restInfo)) formats.push("10bit")
          if (/esub/i.test(restInfo)) formats.push("Subtitles")

          return {
            seriesName: cleanSeriesName,
            season: `S${season.padStart(2, "0")}`,
            episode: `E${episode.padStart(2, "0")}`,
            quality,
            languages,
            format: formats.join(", "),
          }
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (contentType === "movie") {
        await storageService.addContent({
          title,
          description,
          type: "movie",
          url: movieUrl,
        })
      } else {
        const episodes = generateEpisodeUrls(seriesUrl, Number.parseInt(totalEpisodes))
        await storageService.addContent({
          title,
          description,
          type: "series",
          episodes: episodes.map((url, index) => ({
            number: index + 1,
            title: `Episode ${index + 1}`,
            url,
          })),
        })
      }

      toast({
        title: "Success!",
        description: `${contentType === "movie" ? "Movie" : "Series"} added successfully.`,
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "icon"}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className={`font-bold text-white ${isMobile ? "text-xl" : "text-3xl"}`}>Add New Content</h1>
            <p className={`text-gray-300 ${isMobile ? "text-sm" : ""}`}>Add movies or series to your library</p>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl mx-auto bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className={`text-white ${isMobile ? "text-lg" : ""}`}>Content Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Content Type */}
              <div className="space-y-3">
                <Label className="text-white">Content Type</Label>
                <RadioGroup value={contentType} onValueChange={(value: "movie" | "series") => setContentType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="movie" id="movie" />
                    <Label htmlFor="movie" className="text-gray-300">
                      Movie
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="series" id="series" />
                    <Label htmlFor="series" className="text-gray-300">
                      Series
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title..."
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  size={isMobile ? "sm" : "default"}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={3}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>

              {/* Movie URL */}
              {contentType === "movie" && (
                <div className="space-y-2">
                  <Label htmlFor="movieUrl" className="text-white">
                    Movie URL *
                  </Label>
                  <Input
                    id="movieUrl"
                    value={movieUrl}
                    onChange={(e) => setMovieUrl(e.target.value)}
                    placeholder="https://example.com/movie.mp4"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    size={isMobile ? "sm" : "default"}
                  />
                </div>
              )}

              {/* Series Configuration */}
              {contentType === "series" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seriesUrl" className="text-white">
                      First Episode URL *
                    </Label>
                    <Input
                      id="seriesUrl"
                      value={seriesUrl}
                      onChange={(e) => {
                        setSeriesUrl(e.target.value)

                        // Auto-parse series information
                        if (autoParseEnabled && e.target.value) {
                          const parsed = parseVideoUrl(e.target.value)
                          setParsedInfo(parsed)

                          if (parsed && !title) {
                            setTitle(parsed.seriesName)
                          }

                          if (parsed && !description) {
                            setDescription(`${parsed.quality} • ${parsed.languages.join(", ")} • ${parsed.format}`)
                          }
                        }
                      }}
                      placeholder="https://example.com/series/episode1.mkv"
                      required
                      className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      size={isMobile ? "sm" : "default"}
                    />
                    {parsedInfo && (
                      <div className="mt-2 p-3 bg-slate-700 rounded-md">
                        <p className="text-sm text-green-400 mb-2">✓ Auto-detected series information:</p>
                        <div className="text-xs text-gray-300 space-y-1">
                          <p>
                            <strong>Series:</strong> {parsedInfo.seriesName}
                          </p>
                          <p>
                            <strong>Season:</strong> {parsedInfo.season}
                          </p>
                          <p>
                            <strong>Episode:</strong> {parsedInfo.episode}
                          </p>
                          <p>
                            <strong>Quality:</strong> {parsedInfo.quality}
                          </p>
                          <p>
                            <strong>Languages:</strong> {parsedInfo.languages.join(", ")}
                          </p>
                          <p>
                            <strong>Format:</strong> {parsedInfo.format}
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-400">
                      Enter the URL for the first episode. We'll automatically generate URLs for subsequent episodes.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalEpisodes" className="text-white">
                      Total Episodes *
                    </Label>
                    <Input
                      id="totalEpisodes"
                      type="number"
                      value={totalEpisodes}
                      onChange={(e) => setTotalEpisodes(e.target.value)}
                      placeholder="10"
                      min="1"
                      required
                      className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      size={isMobile ? "sm" : "default"}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className={`flex gap-4 pt-4 ${isMobile ? "flex-col" : ""}`}>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-red-600 hover:bg-red-700 ${isMobile ? "w-full" : "flex-1"}`}
                  size={isMobile ? "sm" : "default"}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Adding..." : `Add ${contentType === "movie" ? "Movie" : "Series"}`}
                </Button>
                <Link href="/" className={isMobile ? "w-full" : ""}>
                  <Button
                    type="button"
                    variant="outline"
                    className={`bg-slate-700 border-slate-600 text-white hover:bg-slate-600 ${isMobile ? "w-full" : ""}`}
                    size={isMobile ? "sm" : "default"}
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
