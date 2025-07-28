"use client"

import { useState, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../theme/theme"
import { storageService, type ContentItem, type Bookmark } from "../services/StorageService"

const { width } = Dimensions.get("window")
const cardWidth = (width - 45) / 2

interface BookmarksScreenProps {
  navigation: any
}

export default function BookmarksScreen({ navigation }: BookmarksScreenProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [bookmarkedContent, setBookmarkedContent] = useState<ContentItem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadBookmarks = async () => {
    try {
      const bookmarkData = await storageService.getBookmarks()
      setBookmarks(bookmarkData)

      // Load content for each bookmark
      const contentPromises = bookmarkData.map((bookmark) => storageService.getContent(bookmark.contentId))
      const contentResults = await Promise.all(contentPromises)
      const validContent = contentResults.filter((content) => content !== null) as ContentItem[]

      setBookmarkedContent(validContent)
    } catch (error) {
      console.error("Error loading bookmarks:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadBookmarks()
    setRefreshing(false)
  }

  useFocusEffect(
    useCallback(() => {
      loadBookmarks()
    }, []),
  )

  const removeBookmark = async (contentId: string) => {
    try {
      await storageService.removeBookmark(contentId)
      await loadBookmarks() // Reload bookmarks
    } catch (error) {
      console.error("Error removing bookmark:", error)
    }
  }

  const renderBookmarkItem = ({ item }: { item: ContentItem }) => {
    const bookmark = bookmarks.find((b) => b.contentId === item.id)

    return (
      <TouchableOpacity
        style={styles.bookmarkCard}
        onPress={() => navigation.navigate("Watch", { contentId: item.id })}
      >
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <TouchableOpacity style={styles.removeButton} onPress={() => removeBookmark(item.id)}>
              <Ionicons name="bookmark" size={20} color={theme.colors.warning} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardBadge}>
            <Text style={styles.badgeText}>{item.type === "movie" ? "Movie" : "Series"}</Text>
          </View>

          {item.type === "series" && <Text style={styles.episodeCount}>{item.episodes?.length || 0} episodes</Text>}

          {bookmark?.currentEpisode && (
            <Text style={styles.currentEpisode}>Continue from Episode {bookmark.currentEpisode}</Text>
          )}

          {item.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => navigation.navigate("Watch", { contentId: item.id })}
            >
              <Ionicons name="play" size={16} color="white" />
              <Text style={styles.playButtonText}>Continue</Text>
            </TouchableOpacity>

            <Text style={styles.bookmarkDate}>{new Date(bookmark?.timestamp || 0).toLocaleDateString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
        <Text style={styles.headerSubtitle}>
          {bookmarkedContent.length} saved {bookmarkedContent.length === 1 ? "item" : "items"}
        </Text>
      </View>

      {/* Bookmarks List */}
      {bookmarkedContent.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySubtitle}>Bookmark your favorite movies and series to find them easily later</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate("Home")}>
            <Ionicons name="home" size={20} color="white" />
            <Text style={styles.emptyButtonText}>Browse Content</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookmarkedContent}
          renderItem={renderBookmarkItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.bookmarksList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  bookmarksList: {
    padding: 20,
  },
  bookmarkCard: {
    width: cardWidth,
    marginRight: 15,
    marginBottom: 15,
    borderRadius: 15,
    overflow: "hidden",
  },
  cardContainer: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    minHeight: 200,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginRight: 10,
  },
  removeButton: {
    padding: 4,
  },
  cardBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  episodeCount: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  currentEpisode: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardDescription: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  playButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  bookmarkDate: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
