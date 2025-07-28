"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, BackHandler } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { Rating } from "react-native-ratings"
import Toast from "react-native-toast-message"
import * as Sharing from "expo-sharing"

import { VideoPlayer } from "../components/VideoPlayer"
import { theme } from "../theme/theme"
import { storageService, type ContentItem } from "../services/StorageService"

interface WatchScreenProps {
  navigation: any
  route: any
}

export default function WatchScreen({ navigation, route }: WatchScreenProps) {
  const { contentId } = route.params

  const [content, setContent] = useState<ContentItem | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState(1)
  const [currentVideoUrl, setCurrentVideoUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const [rating, setRating] = useState(0)
  const [showEpisodeList, setShowEpisodeList] = useState(false)

  const loadContent = async () => {
    try {
      const item = await storageService.getContent(contentId)
      setContent(item)

      if (item) {
        // Load viewing history
        const history = await storageService.getViewingHistory(contentId)
        if (history && item.type === "series") {
          setCurrentEpisode(history.currentEpisode || 1)
          setWatchTime(history.currentTime || 0)
        }

        // Set video URL
        if (item.type === "movie") {
          setCurrentVideoUrl(item.url || "")
        } else if (item.episodes && item.episodes.length > 0) {
          const episode = item.episodes.find((ep) => ep.number === (history?.currentEpisode || 1))
          setCurrentVideoUrl(episode?.url || "")
        }

        // Check bookmark status
        const bookmarks = await storageService.getBookmarks()
        setIsBookmarked(bookmarks.some((b) => b.contentId === item.id))

        // Load user rating
        const userRating = await storageService.getUserRating(item.id)
        setRating(userRating || 0)
      }
    } catch (error) {
      console.error("Failed to load content:", error)
      Alert.alert("Error", "Failed to load content")
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      loadContent()
    }, [contentId]),
  )

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack()
      return true
    })

    return () => backHandler.remove()
  }, [navigation])

  useEffect(() => {
    if (content && content.type === "series" && content.episodes) {
      const episode = content.episodes.find((ep) => ep.number === currentEpisode)
      setCurrentVideoUrl(episode?.url || "")
    }
  }, [content, currentEpisode])

  const handleEpisodeSelect = async (episodeNumber: number) => {
    setCurrentEpisode(episodeNumber)
    setShowEpisodeList(false)

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
        Toast.show({
          type: "success",
          text1: "Removed from bookmarks",
          text2: `${content.title} has been removed from your bookmarks`,
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
        Toast.show({
          type: "success",
          text1: "Added to bookmarks",
          text2: `${content.title} has been added to your bookmarks`,
        })
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update bookmark",
      })
    }
  }

  const handleRating = async (newRating: number) => {
    if (!content) return

    try {
      await storageService.saveUserRating(content.id, newRating)
      setRating(newRating)
      Toast.show({
        type: "success",
        text1: "Rating saved",
        text2: `You rated ${content.title} ${newRating} star${newRating !== 1 ? "s" : ""}`,
      })
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save rating",
      })
    }
  }

  const shareContent = async () => {
    if (!content) return

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(currentVideoUrl, {
          dialogTitle: `Share ${content.title}`,
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (!content) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>Content not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Video Player */}
      {currentVideoUrl ? (
        <VideoPlayer
          source={{ uri: currentVideoUrl }}
          title={content.type === "movie" ? content.title : `${content.title} - Episode ${currentEpisode}`}
          startTime={watchTime}
          onProgress={handleVideoProgress}
          onBack={() => navigation.goBack()}
        />
      ) : (
        <View style={styles.noVideoContainer}>
          <Ionicons name="play-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.noVideoText}>No video URL available</Text>
        </View>
      )}

      {/* Content Info */}
      <ScrollView style={styles.contentInfo}>
        <View style={styles.infoContainer}>
          {/* Header */}
          <View style={styles.infoHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.contentTitle}>{content.title}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{content.type === "movie" ? "Movie" : "Series"}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={toggleBookmark} style={styles.actionButton}>
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={isBookmarked ? theme.colors.warning : theme.colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={shareContent} style={styles.actionButton}>
                <Ionicons name="share" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Episode Navigation for Series */}
          {content.type === "series" && (
            <View style={styles.episodeNavigation}>
              <TouchableOpacity
                onPress={goToPreviousEpisode}
                disabled={currentEpisode === 1}
                style={[styles.navButton, currentEpisode === 1 && styles.navButtonDisabled]}
              >
                <Ionicons name="play-skip-back" size={20} color="white" />
                <Text style={styles.navButtonText}>Previous</Text>
              </TouchableOpacity>

              <View style={styles.episodeInfo}>
                <Text style={styles.episodeText}>
                  Episode {currentEpisode} of {content.episodes?.length || 0}
                </Text>
                {watchTime > 0 && <Text style={styles.resumeText}>Resume from {formatTime(watchTime)}</Text>}
              </View>

              <TouchableOpacity
                onPress={goToNextEpisode}
                disabled={currentEpisode === (content.episodes?.length || 0)}
                style={[
                  styles.navButton,
                  currentEpisode === (content.episodes?.length || 0) && styles.navButtonDisabled,
                ]}
              >
                <Text style={styles.navButtonText}>Next</Text>
                <Ionicons name="play-skip-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* Episode List for Series */}
          {content.type === "series" && content.episodes && (
            <View style={styles.episodeSection}>
              <TouchableOpacity style={styles.episodeListHeader} onPress={() => setShowEpisodeList(!showEpisodeList)}>
                <Text style={styles.episodeListTitle}>Episodes ({content.episodes.length})</Text>
                <Ionicons
                  name={showEpisodeList ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {showEpisodeList && (
                <View style={styles.episodeList}>
                  {content.episodes.map((episode) => (
                    <TouchableOpacity
                      key={episode.number}
                      style={[styles.episodeItem, currentEpisode === episode.number && styles.episodeItemActive]}
                      onPress={() => handleEpisodeSelect(episode.number)}
                    >
                      <View style={styles.episodeNumber}>
                        <Text style={styles.episodeNumberText}>{episode.number}</Text>
                      </View>
                      <View style={styles.episodeDetails}>
                        <Text style={styles.episodeTitle}>{episode.title}</Text>
                        {currentEpisode === episode.number && watchTime > 0 && (
                          <Text style={styles.episodeProgress}>Resume from {formatTime(watchTime)}</Text>
                        )}
                      </View>
                      {currentEpisode === episode.number && (
                        <Ionicons name="play" size={24} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Rating */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Rate this {content.type}</Text>
            <Rating
              type="star"
              ratingCount={5}
              imageSize={30}
              startingValue={rating}
              onFinishRating={handleRating}
              style={styles.rating}
              tintColor={theme.colors.surface}
            />
            {rating > 0 && <Text style={styles.ratingText}>You rated this {rating}/5 stars</Text>}
          </View>

          {/* Description */}
          {content.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{content.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: 18,
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    color: theme.colors.text,
    fontSize: 18,
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  noVideoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  noVideoText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 10,
  },
  contentInfo: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  infoContainer: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    marginRight: 15,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  typeBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 15,
  },
  actionButton: {
    padding: 8,
  },
  episodeNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  navButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.5,
  },
  navButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  episodeInfo: {
    alignItems: "center",
  },
  episodeText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  resumeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  episodeSection: {
    marginBottom: 20,
  },
  episodeListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 15,
  },
  episodeListTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  episodeList: {
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    marginTop: 10,
    overflow: "hidden",
  },
  episodeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  episodeItemActive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  episodeNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.textSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  episodeNumberText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  episodeDetails: {
    flex: 1,
  },
  episodeTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  episodeProgress: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  ratingSection: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  rating: {
    paddingVertical: 10,
  },
  ratingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
  descriptionSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 20,
  },
  descriptionText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
})
