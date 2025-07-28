"use client"

import { useState, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Dimensions } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../theme/theme"
import { storageService, type ContentItem } from "../services/StorageService"

const { width } = Dimensions.get("window")
const cardWidth = (width - 45) / 2

interface HomeScreenProps {
  navigation: any
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "movie" | "series" | "bookmarked">("all")
  const [bookmarkedContent, setBookmarkedContent] = useState<string[]>([])
  const [recentlyWatched, setRecentlyWatched] = useState<ContentItem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadContent = async () => {
    try {
      const allContent = await storageService.getAllContent()
      setContent(allContent)
    } catch (error) {
      console.error("Error loading content:", error)
    }
  }

  const loadBookmarks = async () => {
    try {
      const bookmarks = await storageService.getBookmarks()
      setBookmarkedContent(bookmarks.map((b) => b.contentId))
    } catch (error) {
      console.error("Error loading bookmarks:", error)
    }
  }

  const loadRecentlyWatched = async () => {
    try {
      const history = await storageService.getAllViewingHistory()
      const recentHistory = history.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)

      const recentContent = []
      for (const h of recentHistory) {
        const content = await storageService.getContent(h.contentId)
        if (content) {
          recentContent.push(content)
        }
      }
      setRecentlyWatched(recentContent)
    } catch (error) {
      console.error("Error loading recently watched:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadContent(), loadBookmarks(), loadRecentlyWatched()])
    setRefreshing(false)
  }

  useFocusEffect(
    useCallback(() => {
      loadContent()
      loadBookmarks()
      loadRecentlyWatched()
    }, []),
  )

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

  const renderContentItem = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity style={styles.contentCard} onPress={() => navigation.navigate("Watch", { contentId: item.id })}>
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.cardBadge}>
            <Text style={styles.badgeText}>{item.type === "movie" ? "Movie" : "Series"}</Text>
          </View>
        </View>

        {item.type === "series" && <Text style={styles.episodeCount}>{item.episodes?.length || 0} episodes</Text>}

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
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.playButtonText}>{item.type === "movie" ? "Watch" : "Watch Series"}</Text>
          </TouchableOpacity>

          {bookmarkedContent.includes(item.id) && <Ionicons name="bookmark" size={20} color={theme.colors.warning} />}
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderRecentItem = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity style={styles.recentCard} onPress={() => navigation.navigate("Watch", { contentId: item.id })}>
      <View style={styles.recentContent}>
        <Text style={styles.recentTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.recentType}>{item.type === "movie" ? "Movie" : "Series"}</Text>
        <Ionicons name="play" size={24} color="white" />
      </View>
    </TouchableOpacity>
  )

  const FilterButton = ({
    title,
    value,
    icon,
  }: {
    title: string
    value: string
    icon: string
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value as any)}
    >
      <Ionicons name={icon as any} size={16} color={filter === value ? "white" : theme.colors.textSecondary} />
      <Text style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}>{title}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>StreamFlix</Text>
        <Text style={styles.headerSubtitle}>Your personal streaming platform</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate("QuickAdd")}>
            <Ionicons name="flash" size={20} color="white" />
            <Text style={styles.headerButtonText}>Quick Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerButton, styles.primaryButton]}
            onPress={() => navigation.navigate("Add")}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.headerButtonText}>Add Content</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recently Watched */}
      {recentlyWatched.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Watching</Text>
          <FlatList
            data={recentlyWatched}
            renderItem={renderRecentItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          />
        </View>
      )}

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies and series..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <View style={styles.filterContainer}>
          <FilterButton title="All" value="all" icon="apps" />
          <FilterButton title="Movies" value="movie" icon="film" />
          <FilterButton title="Series" value="series" icon="tv" />
          <FilterButton title="Saved" value="bookmarked" icon="bookmark" />
        </View>
      </View>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="film" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No content found</Text>
          <Text style={styles.emptySubtitle}>
            {filter === "bookmarked"
              ? "You haven't bookmarked any content yet"
              : "Add some movies or series to get started"}
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate("Add")}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyButtonText}>Add Your First Content</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredContent}
          renderItem={renderContentItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.contentList}
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
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  headerButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  recentList: {
    paddingHorizontal: 20,
  },
  recentCard: {
    width: 150,
    height: 80,
    marginRight: 15,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: theme.colors.primary,
  },
  recentContent: {
    flex: 1,
    padding: 15,
    justifyContent: "space-between",
  },
  recentTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  recentType: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: theme.colors.text,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    gap: 5,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "white",
  },
  contentList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contentCard: {
    width: cardWidth,
    marginRight: 15,
    marginBottom: 15,
    borderRadius: 15,
    overflow: "hidden",
  },
  cardContainer: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    minHeight: 180,
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
  cardBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  episodeCount: {
    color: theme.colors.textSecondary,
    fontSize: 12,
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
