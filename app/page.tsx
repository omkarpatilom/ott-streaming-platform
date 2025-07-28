"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Play, Plus, Search, Film, Tv, Zap, Bookmark, Clock, Menu } from "lucide-react"
import Link from "next/link"
import { type ContentItem, storageService } from "@/lib/storage"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function HomePage() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "movie" | "series" | "bookmarked">("all")
  const [bookmarkedContent, setBookmarkedContent] = useState<string[]>([])
  const [recentlyWatched, setRecentlyWatched] = useState<ContentItem[]>([])
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
    loadBookmarks()
    loadRecentlyWatched()
  }, [])

  const loadContent = async () => {
    const allContent = await storageService.getAllContent()
    setContent(allContent)
  }

  const loadBookmarks = async () => {
    const bookmarks = await storageService.getBookmarks()
    setBookmarkedContent(bookmarks.map((b) => b.contentId))
  }

  const loadRecentlyWatched = async () => {
    const history = await storageService.getAllViewingHistory()
    const recentHistory = history.sort((a, b) => b.timestamp - a.timestamp).slice(0, isMobile ? 3 : 5)

    const recentContent = []
    for (const h of recentHistory) {
      const content = await storageService.getContent(h.contentId)
      if (content) {
        recentContent.push(content)
      }
    }
    setRecentlyWatched(recentContent)
  }

  const filteredContent = content.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
    let matchesFilter = true

    switch (filter) {
      case "movie":
        matchesFilter = item.type === "movie"
        break
      case "series":
        matchesFilter = item.type === "series"
        break
      case "bookmarked":
        matchesFilter = bookmarkedContent.includes(item.id)
        break
      default:
        matchesFilter = true
    }

    return matchesSearch && matchesFilter
  })

  const FilterButtons = () => (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Button
        variant={filter === "all" ? "default" : "outline"}
        onClick={() => setFilter("all")}
        size={isMobile ? "sm" : "default"}
        className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 whitespace-nowrap"
      >
        All
      </Button>
      <Button
        variant={filter === "movie" ? "default" : "outline"}
        onClick={() => setFilter("movie")}
        size={isMobile ? "sm" : "default"}
        className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 whitespace-nowrap"
      >
        <Film className="w-4 h-4 mr-1" />
        Movies
      </Button>
      <Button
        variant={filter === "series" ? "default" : "outline"}
        onClick={() => setFilter("series")}
        size={isMobile ? "sm" : "default"}
        className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 whitespace-nowrap"
      >
        <Tv className="w-4 h-4 mr-1" />
        Series
      </Button>
      <Button
        variant={filter === "bookmarked" ? "default" : "outline"}
        onClick={() => setFilter("bookmarked")}
        size={isMobile ? "sm" : "default"}
        className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 whitespace-nowrap"
      >
        <Bookmark className="w-4 h-4 mr-1" />
        Saved
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Mobile Header */}
        <div className={`flex justify-between items-start mb-6 gap-4 ${isMobile ? "flex-col" : "md:flex-row"}`}>
          <div>
            <h1 className={`font-bold text-white mb-2 ${isMobile ? "text-2xl" : "text-4xl"}`}>StreamFlix</h1>
            <p className={`text-gray-300 ${isMobile ? "text-sm" : ""}`}>Your personal streaming platform</p>
          </div>

          {isMobile ? (
            <div className="flex gap-2 w-full">
              <Link href="/quick-add" className="flex-1">
                <Button
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
              </Link>
              <Link href="/add-content" className="flex-1">
                <Button className="w-full bg-red-600 hover:bg-red-700" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href="/quick-add">
                <Button className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
              </Link>
              <Link href="/add-content">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recently Watched */}
        {recentlyWatched.length > 0 && (
          <div className="mb-6">
            <h2 className={`font-bold text-white mb-4 flex items-center gap-2 ${isMobile ? "text-lg" : "text-2xl"}`}>
              <Clock className={`${isMobile ? "w-5 h-5" : "w-6 h-6"}`} />
              Continue Watching
            </h2>
            <div
              className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"}`}
            >
              {recentlyWatched.map((item) => (
                <Card
                  key={item.id}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors group"
                >
                  <CardContent className={isMobile ? "p-3" : "p-4"}>
                    <div className="space-y-2">
                      <h3 className={`text-white font-medium line-clamp-2 ${isMobile ? "text-xs" : "text-sm"}`}>
                        {item.title}
                      </h3>
                      <Badge variant={item.type === "movie" ? "default" : "secondary"} className="text-xs">
                        {item.type === "movie" ? "Movie" : "Series"}
                      </Badge>
                      <Link href={`/watch/${item.id}`}>
                        <Button size="sm" className="w-full bg-red-600 hover:bg-red-700">
                          <Play className="w-3 h-3 mr-1" />
                          Continue
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className={`flex gap-4 mb-6 ${isMobile ? "flex-col" : "md:flex-row"}`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search movies and series..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-gray-400"
              size={isMobile ? "sm" : "default"}
            />
          </div>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                  <Menu className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-slate-900 border-slate-700">
                <div className="py-4">
                  <h3 className="text-white font-medium mb-4">Filter Content</h3>
                  <FilterButtons />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <FilterButtons />
          )}
        </div>

        {/* Content Grid */}
        {filteredContent.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Film className={`mx-auto mb-4 opacity-50 ${isMobile ? "w-12 h-12" : "w-16 h-16"}`} />
              <p className={isMobile ? "text-lg" : "text-xl"}>No content found</p>
              <p className={`${isMobile ? "text-xs" : "text-sm"}`}>
                {filter === "bookmarked"
                  ? "You haven't bookmarked any content yet"
                  : "Add some movies or series to get started"}
              </p>
            </div>
            <Link href="/add-content">
              <Button className="bg-red-600 hover:bg-red-700 mt-4" size={isMobile ? "sm" : "default"}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Content
              </Button>
            </Link>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            }`}
          >
            {filteredContent.map((item) => (
              <Card key={item.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors group">
                <CardHeader className={isMobile ? "pb-2" : "pb-3"}>
                  <div className="flex items-start justify-between">
                    <CardTitle className={`text-white line-clamp-2 ${isMobile ? "text-base" : "text-lg"}`}>
                      {item.title}
                    </CardTitle>
                    <div className="flex items-center gap-1 ml-2">
                      <Badge variant={item.type === "movie" ? "default" : "secondary"} className="shrink-0 text-xs">
                        {item.type === "movie" ? "Movie" : "Series"}
                      </Badge>
                      {bookmarkedContent.includes(item.id) && (
                        <Bookmark className="w-3 h-3 text-yellow-400 fill-current" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={isMobile ? "pt-0" : ""}>
                  <div className="space-y-3">
                    {item.type === "series" && (
                      <div className={`text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                        {item.episodes?.length || 0} episodes available
                      </div>
                    )}
                    {item.description && !isMobile && (
                      <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/watch/${item.id}`} className="flex-1">
                        <Button
                          className="w-full bg-red-600 hover:bg-red-700 group-hover:bg-red-500"
                          size={isMobile ? "sm" : "default"}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {item.type === "movie" ? "Watch Movie" : "Watch Series"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
