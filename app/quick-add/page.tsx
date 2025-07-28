"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Zap, Play } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { storageService } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

export default function QuickAddPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [totalEpisodes, setTotalEpisodes] = useState("8")
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedInfo, setParsedInfo] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  React.useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const parseVideoUrl = (url: string) => {
    try {
      const filename = url.split("/").pop() || ""
      const patterns = [
        /^.*?-(.+?)\.S(\d+)E(\d+)\.(\d+p)\.(.+?)\.x(\d+)\.(.+?)\.mkv$/i,
        /^(.+?)\.S(\d+)E(\d+)\.(\d+p)\.(.+?)\.mkv$/i,
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
          if (/x264/i.test(restInfo)) formats.push("x264")
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

  const generateEpisodes = (baseUrl: string, total: number) => {
    const episodes = []
    const parsed = parseVideoUrl(baseUrl)

    if (parsed) {
      for (let i = 1; i <= total; i++) {
        const episodeNumber = `E${i.toString().padStart(2, "0")}`
        const episodeUrl = baseUrl.replace(
          new RegExp(`${parsed.season}${parsed.episode}`, "i"),
          `${parsed.season}${episodeNumber}`,
        )

        episodes.push({
          number: i,
          title: `Episode ${i}`,
          url: episodeUrl,
        })
      }
    }

    return episodes
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    if (value) {
      const parsed = parseVideoUrl(value)
      setParsedInfo(parsed)
    } else {
      setParsedInfo(null)
    }
  }

  const handleQuickAdd = async () => {
    if (!url || !parsedInfo) {
      toast({
        title: "Error",
        description: "Please enter a valid series URL",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const episodes = generateEpisodes(url, Number.parseInt(totalEpisodes))
      const description = `${parsedInfo.quality} • ${parsedInfo.languages.join(", ")} • ${parsedInfo.format}`

      await storageService.addContent({
        title: parsedInfo.seriesName,
        description,
        type: "series",
        episodes,
      })

      toast({
        title: "Success!",
        description: `${parsedInfo.seriesName} added with ${totalEpisodes} episodes.`,
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add series. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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
            <h1 className={`font-bold text-white flex items-center gap-2 ${isMobile ? "text-xl" : "text-3xl"}`}>
              <Zap className={`text-yellow-500 ${isMobile ? "w-6 h-6" : "w-8 h-8"}`} />
              Quick Add Series
            </h1>
            <p className={`text-gray-300 ${isMobile ? "text-sm" : ""}`}>Instantly add series from direct video links</p>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl mx-auto bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className={`text-white ${isMobile ? "text-lg" : ""}`}>Add Series from Direct Link</CardTitle>
            <p className={`text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}>
              Paste a direct video link and we'll automatically extract the series information
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url" className="text-white">
                Direct Video URL *
              </Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://s2.novadrivesx01.workers.dev/0:/Storage/..."
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                size={isMobile ? "sm" : "default"}
              />
              <p className={`text-gray-400 ${isMobile ? "text-xs" : "text-xs"}`}>
                Supports common series naming patterns (e.g., SeriesName.S01E01.720p.mkv)
              </p>
            </div>

            {/* Parsed Information */}
            {parsedInfo && (
              <div className="p-4 bg-slate-700 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-green-400 font-medium">Series Detected</p>
                </div>
                <div className={`grid gap-4 text-sm ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  <div>
                    <p className="text-gray-400">Series Name</p>
                    <p className="text-white font-medium">{parsedInfo.seriesName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Quality</p>
                    <p className="text-white">{parsedInfo.quality}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Languages</p>
                    <p className="text-white">{parsedInfo.languages.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Format</p>
                    <p className="text-white">{parsedInfo.format}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Total Episodes */}
            <div className="space-y-2">
              <Label htmlFor="totalEpisodes" className="text-white">
                Total Episodes *
              </Label>
              <Input
                id="totalEpisodes"
                type="number"
                value={totalEpisodes}
                onChange={(e) => setTotalEpisodes(e.target.value)}
                min="1"
                max="50"
                className="bg-slate-700 border-slate-600 text-white"
                size={isMobile ? "sm" : "default"}
              />
            </div>

            {/* Action Buttons */}
            <div className={`flex gap-4 pt-4 ${isMobile ? "flex-col" : ""}`}>
              <Button
                onClick={handleQuickAdd}
                disabled={!parsedInfo || isProcessing}
                className={`bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 ${isMobile ? "w-full" : "flex-1"}`}
                size={isMobile ? "sm" : "default"}
              >
                <Zap className="w-4 h-4 mr-2" />
                {isProcessing ? "Adding Series..." : "Quick Add Series"}
              </Button>
              <Link href="/" className={isMobile ? "w-full" : ""}>
                <Button
                  variant="outline"
                  className={`bg-slate-700 border-slate-600 text-white hover:bg-slate-600 ${isMobile ? "w-full" : ""}`}
                  size={isMobile ? "sm" : "default"}
                >
                  Cancel
                </Button>
              </Link>
            </div>

            {/* Preview */}
            {parsedInfo && totalEpisodes && (
              <div className="mt-6 p-4 bg-slate-900 rounded-lg">
                <p className="text-white font-medium mb-2">Preview Episodes:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Array.from({ length: Math.min(5, Number.parseInt(totalEpisodes)) }, (_, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <Play className="w-3 h-3" />
                      <span>Episode {i + 1}</span>
                    </div>
                  ))}
                  {Number.parseInt(totalEpisodes) > 5 && (
                    <p className="text-xs text-gray-500">... and {Number.parseInt(totalEpisodes) - 5} more episodes</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
