"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Play,
  SkipForward,
  SkipBack,
  Clock,
  Star,
  Share2,
  Bookmark,
  BookmarkCheck,
  Menu,
} from "lucide-react"
import Link from "next/link"
import { type ContentItem, storageService } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { UniversalVideoPlayer } from "@/components/universal-video-player"

export default function WatchPage() {
  const params = useParams()
  const { toast } = useToast()
  const [content, setContent] = useState<ContentItem | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState(1)
  const [currentVideoUrl, setCurrentVideoUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const [totalWatchTime, setTotalWatchTime] = useState(0)
  const [rating, setRating] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
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

  useEffect(() => {
    loadContent()
  }, [params.id])

  useEffect(() => {
    if (content) {
      if (content.type === "movie") {
        setCurrentVideoUrl(content.url || "")
      } else if (content.episodes && content.episodes.length > 0) {
        const episode = content.episodes.find((ep) => ep.number === currentEpisode)
        setCurrentVideoUrl(episode?.url || "")
      }
      checkBookmarkStatus()
      loadUserRating()
    }
  }, [content, currentEpisode])

  const loadContent = async () => {
    try {
      const item = await storageService.getContent(params.id as string)
      setContent(item)

      // Load viewing history
      const history = await storageService.getViewingHistory(params.id as string)
      if (history && item?.type === "series") {
        setCurrentEpisode(history.currentEpisode || 1)
        setWatchTime(history.currentTime || 0)
      }

      // Load total watch time
      const allHistory = await storageService.getAllViewingHistory()
      const contentHistory = allHistory.filter((h) => h.contentId === (params.id as string))
      const total = contentHistory.reduce((sum, h) => sum + (h.currentTime || 0), 0)
      setTotalWatchTime(total)
    } catch (error) {
      console.error("Failed to load content:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkBookmarkStatus = async () => {
    if (content) {
      const bookmarks = await storageService.getBookmarks()
      setIsBookmarked(bookmarks.some((b) => b.contentId === content.id))
    }
  }

  const loadUserRating = async () => {
    if (content) {
      const userRating = await storageService.getUserRating(content.id)
      setRating(userRating || 0)
    }
  }

  const handleEpisodeSelect = async (episodeNumber: number) => {
    setCurrentEpisode(episodeNumber)

    // Save viewing progress
    if (content) {
      await storageService.saveViewingHistory({
        contentId: content.id,
        currentEpisode: episodeNumber,
        timestamp: Date.now(),
      })
    }
  }

  const handleVideoProgress = async (currentTime: number, duration: number) => {
    setWatchTime(currentTime)

    if (content) {
      await storageService.saveViewingHistory({
        contentId: content.id,
        currentEpisode: content.type === "series" ? currentEpisode : undefined,
        currentTime,
        duration,
        timestamp: Date.now(),
      })
    }
  }

  const toggleBookmark = async () => {
    if (!content) return

    try {
      if (isBookmarked) {
        await storageService.removeBookmark(content.id)
        setIsBookmarked(false)
        toast({
          title: "Removed from bookmarks",
          description: `${content.title} has been removed from your bookmarks`,
        })
      } else {
        await storageService.addBookmark({
          contentId: content.id,
          title: content.title,
          type: content.type,
          timestamp: Date.now(),
          currentEpisode: content.type === "series" ? currentEpisode : undefined,
        })
        setIsBookmarked(true)
        toast({
          title: "Added to bookmarks",
          description: `${content.title} has been added to your bookmarks`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      })
    }
  }

  const handleRating = async (newRating: number) => {
    if (!content) return

    try {
      await storageService.saveUserRating(content.id, newRating)
      setRating(newRating)
      toast({
        title: "Rating saved",
        description: `You rated ${content.title} ${newRating} star${newRating !== 1 ? "s" : ""}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save rating",
        variant: "destructive",
      })
    }
  }

  const shareContent = async () => {
    if (!content) return

    const shareData = {
      title: content.title,
      text: `Check out ${content.title} on StreamFlix`,
      url: window.location.href,
    }

    try {
      if (navigator.share && isMobile) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied",
          description: "Share link has been copied to clipboard",
        })
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share content",
        variant: "destructive",
      })
    }
  }

  const goToNextEpisode = () => {
    if (content?.type === "series" && content.episodes) {
      const nextEpisode = currentEpisode + 1
      if (nextEpisode <= content.episodes.length) {
        handleEpisodeSelect(nextEpisode)
      }
    }
  }

  const goToPreviousEpisode = () => {
    if (content?.type === "series" && currentEpisode > 1) {
      handleEpisodeSelect(currentEpisode - 1)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-white text-xl mb-4">Content not found</div>
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const EpisodeList = () => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between text-base">
          Episodes
          <Badge variant="outline" className="text-xs">
            {content.episodes?.length || 0} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto">
          {content.episodes?.map((episode) => (
            <button
              key={episode.number}
              onClick={() => handleEpisodeSelect(episode.number)}
              className={`w-full text-left p-3 border-b border-slate-700 hover:bg-slate-700 transition-colors ${
                currentEpisode === episode.number ? "bg-slate-700" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentEpisode === episode.number ? "bg-red-600 text-white" : "bg-slate-600 text-gray-300"
                  }`}
                >
                  {episode.number}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{episode.title}</p>
                  {currentEpisode === episode.number && watchTime > 0 && (
                    <p className="text-xs text-gray-400">Resume from {formatTime(watchTime)}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link href="/">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "icon"}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className={`font-bold text-white truncate ${isMobile ? "text-lg" : "text-2xl md:text-3xl"}`}>
                {content.title}
              </h1>
              <Badge variant={content.type === "movie" ? "default" : "secondary"} className="text-xs shrink-0">
                {content.type === "movie" ? "Movie" : "Series"}
              </Badge>
            </div>
            {content.type === "series" && (
              <div className={`flex items-center gap-3 text-gray-300 ${isMobile ? "text-sm" : ""}`}>
                <span>
                  Episode {currentEpisode} of {content.episodes?.length || 0}
                </span>
                {!isMobile && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(totalWatchTime)} watched
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleBookmark}
              variant="outline"
              size={isMobile ? "sm" : "icon"}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </Button>
            <Button
              onClick={shareContent}
              variant="outline"
              size={isMobile ? "sm" : "icon"}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <Share2 className="w-4 h-4" />
            </Button>

            {/* Mobile Episode Menu */}
            {content.type === "series" && isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-slate-900 border-slate-700 w-80">
                  <div className="mt-6">
                    <EpisodeList />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Episode Navigation for Series (Mobile) */}
        {content.type === "series" && isMobile && (
          <div className="flex items-center justify-between mb-4 gap-2">
            <Button
              onClick={goToPreviousEpisode}
              disabled={currentEpisode === 1}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50 flex-1"
            >
              <SkipBack className="w-3 h-3 mr-1" />
              Previous
            </Button>

            <div className="text-center px-2">
              <div className="text-white font-medium text-sm">Episode {currentEpisode}</div>
              {watchTime > 0 && <div className="text-xs text-gray-400">Resume {formatTime(watchTime)}</div>}
            </div>

            <Button
              onClick={goToNextEpisode}
              disabled={currentEpisode === (content.episodes?.length || 0)}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50 flex-1"
            >
              Next
              <SkipForward className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Episode Navigation for Series (Desktop) */}
        {content.type === "series" && !isMobile && (
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={goToPreviousEpisode}
              disabled={currentEpisode === 1}
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              <SkipBack className="w-4 h-4 mr-2" />
              Previous Episode
            </Button>

            <div className="text-center">
              <div className="text-white font-medium">Episode {currentEpisode}</div>
              <div className="text-sm text-gray-400">{watchTime > 0 && `Resume from ${formatTime(watchTime)}`}</div>
            </div>

            <Button
              onClick={goToNextEpisode}
              disabled={currentEpisode === (content.episodes?.length || 0)}
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Next Episode
              <SkipForward className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-4 gap-6"}`}>
          {/* Video Player */}
          <div className={isMobile ? "" : "lg:col-span-3"}>
            <div className="bg-black rounded-lg overflow-hidden">
              {currentVideoUrl ? (
                <UniversalVideoPlayer
                  src={currentVideoUrl}
                  title={content.type === "movie" ? content.title : `${content.title} - Episode ${currentEpisode}`}
                  onProgress={handleVideoProgress}
                  startTime={watchTime}
                />
              ) : (
                <div className="aspect-video flex items-center justify-center text-white">
                  <div className="text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No video URL available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Content Info */}
            {isMobile && (
              <div className="mt-4 space-y-4">
                {/* Rating */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium mb-2 text-sm">Rate this {content.type}</h3>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRating(star)}
                              className={`text-lg transition-colors ${
                                star <= rating ? "text-yellow-400" : "text-gray-600 hover:text-yellow-300"
                              }`}
                            >
                              <Star className={`w-5 h-5 ${star <= rating ? "fill-current" : ""}`} />
                            </button>
                          ))}
                          {rating > 0 && <span className="text-gray-400 ml-2 text-sm">({rating}/5)</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                {content.description && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-base">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 leading-relaxed text-sm">{content.description}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Desktop Episode List */}
          {content.type === "series" && content.episodes && !isMobile && (
            <div className="lg:col-span-1">
              <EpisodeList />
            </div>
          )}

          {/* Desktop Content Info */}
          {!isMobile && (
            <div className="lg:col-span-3 mt-6 space-y-6">
              {/* Rating */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium mb-2">Rate this {content.type}</h3>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRating(star)}
                            className={`text-2xl transition-colors ${
                              star <= rating ? "text-yellow-400" : "text-gray-600 hover:text-yellow-300"
                            }`}
                          >
                            <Star className={`w-6 h-6 ${star <= rating ? "fill-current" : ""}`} />
                          </button>
                        ))}
                        {rating > 0 && <span className="text-gray-400 ml-2">({rating}/5)</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{isBookmarked ? "Bookmarked" : "Add to Bookmarks"}</div>
                      <Button
                        onClick={toggleBookmark}
                        variant={isBookmarked ? "default" : "outline"}
                        size="sm"
                        className="mt-2"
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="w-4 h-4 mr-2" />
                        ) : (
                          <Bookmark className="w-4 h-4 mr-2" />
                        )}
                        {isBookmarked ? "Bookmarked" : "Bookmark"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {content.description && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed">{content.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
