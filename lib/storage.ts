import localforage from "localforage"

// Configure localforage
localforage.config({
  name: "StreamFlix",
  storeName: "content_db",
  description: "OTT Platform Content Database",
})

export interface Episode {
  number: number
  title: string
  url: string
}

export interface ContentItem {
  id: string
  title: string
  description?: string
  type: "movie" | "series"
  url?: string // For movies
  episodes?: Episode[] // For series
  createdAt: number
}

export interface ViewingHistory {
  contentId: string
  currentEpisode?: number
  currentTime?: number
  duration?: number
  timestamp: number
}

export interface Bookmark {
  contentId: string
  title: string
  type: "movie" | "series"
  currentEpisode?: number
  timestamp: number
}

export interface UserRating {
  contentId: string
  rating: number
  timestamp: number
}

class StorageService {
  private contentKey = "content"
  private historyKey = "viewing_history"
  private bookmarksKey = "bookmarks"
  private ratingsKey = "ratings"

  // Content Management
  async addContent(content: Omit<ContentItem, "id" | "createdAt">): Promise<ContentItem> {
    const processedContent = { ...content }

    // Auto-extract series information if it's a series with episodes
    if (content.type === "series" && content.episodes && content.episodes.length > 0) {
      const firstEpisodeUrl = content.episodes[0].url
      const parsedInfo = this.parseVideoUrl(firstEpisodeUrl)

      if (parsedInfo && !content.title.trim()) {
        processedContent.title = parsedInfo.seriesName
      }

      if (parsedInfo && !content.description) {
        processedContent.description = `${parsedInfo.quality} • ${parsedInfo.languages.join(", ")} • ${parsedInfo.format}`
      }
    }

    const newContent: ContentItem = {
      ...processedContent,
      id: this.generateId(),
      createdAt: Date.now(),
    }

    const existingContent = await this.getAllContent()
    const updatedContent = [...existingContent, newContent]

    await localforage.setItem(this.contentKey, updatedContent)
    return newContent
  }

  async getAllContent(): Promise<ContentItem[]> {
    const content = await localforage.getItem<ContentItem[]>(this.contentKey)
    return content || []
  }

  async getContent(id: string): Promise<ContentItem | null> {
    const allContent = await this.getAllContent()
    return allContent.find((item) => item.id === id) || null
  }

  async updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    const allContent = await this.getAllContent()
    const index = allContent.findIndex((item) => item.id === id)

    if (index === -1) return null

    allContent[index] = { ...allContent[index], ...updates }
    await localforage.setItem(this.contentKey, allContent)
    return allContent[index]
  }

  async deleteContent(id: string): Promise<boolean> {
    const allContent = await this.getAllContent()
    const filteredContent = allContent.filter((item) => item.id !== id)

    if (filteredContent.length === allContent.length) return false

    await localforage.setItem(this.contentKey, filteredContent)

    // Also delete related data
    await this.deleteViewingHistory(id)
    await this.removeBookmark(id)
    await this.removeUserRating(id)
    return true
  }

  // Viewing History Management
  async saveViewingHistory(history: ViewingHistory): Promise<void> {
    const allHistory = await this.getAllViewingHistory()
    const existingIndex = allHistory.findIndex((h) => h.contentId === history.contentId)

    if (existingIndex >= 0) {
      allHistory[existingIndex] = history
    } else {
      allHistory.push(history)
    }

    await localforage.setItem(this.historyKey, allHistory)
  }

  async getViewingHistory(contentId: string): Promise<ViewingHistory | null> {
    const allHistory = await this.getAllViewingHistory()
    return allHistory.find((h) => h.contentId === contentId) || null
  }

  async getAllViewingHistory(): Promise<ViewingHistory[]> {
    const history = await localforage.getItem<ViewingHistory[]>(this.historyKey)
    return history || []
  }

  async deleteViewingHistory(contentId: string): Promise<void> {
    const allHistory = await this.getAllViewingHistory()
    const filteredHistory = allHistory.filter((h) => h.contentId !== contentId)
    await localforage.setItem(this.historyKey, filteredHistory)
  }

  // Bookmarks Management
  async addBookmark(bookmark: Bookmark): Promise<void> {
    const bookmarks = await this.getBookmarks()
    const existingIndex = bookmarks.findIndex((b) => b.contentId === bookmark.contentId)

    if (existingIndex >= 0) {
      bookmarks[existingIndex] = bookmark
    } else {
      bookmarks.push(bookmark)
    }

    await localforage.setItem(this.bookmarksKey, bookmarks)
  }

  async removeBookmark(contentId: string): Promise<void> {
    const bookmarks = await this.getBookmarks()
    const filteredBookmarks = bookmarks.filter((b) => b.contentId !== contentId)
    await localforage.setItem(this.bookmarksKey, filteredBookmarks)
  }

  async getBookmarks(): Promise<Bookmark[]> {
    const bookmarks = await localforage.getItem<Bookmark[]>(this.bookmarksKey)
    return bookmarks || []
  }

  // Ratings Management
  async saveUserRating(contentId: string, rating: number): Promise<void> {
    const ratings = await this.getUserRatings()
    const existingIndex = ratings.findIndex((r) => r.contentId === contentId)

    const userRating: UserRating = {
      contentId,
      rating,
      timestamp: Date.now(),
    }

    if (existingIndex >= 0) {
      ratings[existingIndex] = userRating
    } else {
      ratings.push(userRating)
    }

    await localforage.setItem(this.ratingsKey, ratings)
  }

  async getUserRating(contentId: string): Promise<number | null> {
    const ratings = await this.getUserRatings()
    const rating = ratings.find((r) => r.contentId === contentId)
    return rating?.rating || null
  }

  async getUserRatings(): Promise<UserRating[]> {
    const ratings = await localforage.getItem<UserRating[]>(this.ratingsKey)
    return ratings || []
  }

  async removeUserRating(contentId: string): Promise<void> {
    const ratings = await this.getUserRatings()
    const filteredRatings = ratings.filter((r) => r.contentId !== contentId)
    await localforage.setItem(this.ratingsKey, filteredRatings)
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private parseVideoUrl(url: string) {
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

  // Data Export/Import
  async exportData(): Promise<{
    content: ContentItem[]
    history: ViewingHistory[]
    bookmarks: Bookmark[]
    ratings: UserRating[]
  }> {
    const content = await this.getAllContent()
    const history = await this.getAllViewingHistory()
    const bookmarks = await this.getBookmarks()
    const ratings = await this.getUserRatings()
    return { content, history, bookmarks, ratings }
  }

  async importData(data: {
    content: ContentItem[]
    history: ViewingHistory[]
    bookmarks: Bookmark[]
    ratings: UserRating[]
  }): Promise<void> {
    await localforage.setItem(this.contentKey, data.content)
    await localforage.setItem(this.historyKey, data.history)
    await localforage.setItem(this.bookmarksKey, data.bookmarks)
    await localforage.setItem(this.ratingsKey, data.ratings)
  }

  async clearAllData(): Promise<void> {
    await localforage.clear()
  }
}

export const storageService = new StorageService()
