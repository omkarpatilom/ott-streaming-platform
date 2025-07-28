"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Alert, Platform } from "react-native"
import { Video, ResizeMode } from "expo-av"
import * as ScreenOrientation from "expo-screen-orientation"
import * as Linking from "expo-linking"
import * as Clipboard from "expo-clipboard"
import * as Sharing from "expo-sharing"
import { Ionicons } from "@expo/vector-icons"
import Slider from "react-native-slider"
import { StatusBar } from "expo-status-bar"
import Toast from "react-native-toast-message"
import { theme } from "../theme/theme"

interface VideoPlayerProps {
  source: { uri: string }
  title: string
  startTime?: number
  onProgress?: (currentTime: number, duration: number) => void
  onBack?: () => void
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, title, startTime = 0, onProgress, onBack }) => {
  const videoRef = useRef<Video>(null)
  const [status, setStatus] = useState<any>({})
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(1.0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const controlsTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Set initial time if provided
    if (startTime > 0 && videoRef.current) {
      videoRef.current.setPositionAsync(startTime * 1000)
    }
  }, [startTime])

  useEffect(() => {
    // Auto-hide controls
    if (showControls && status.isPlaying) {
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current)
      }
    }
  }, [showControls, status.isPlaying])

  const toggleControls = () => {
    setShowControls(!showControls)
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current)
    }
  }

  const togglePlayPause = async () => {
    if (status.isPlaying) {
      await videoRef.current?.pauseAsync()
    } else {
      await videoRef.current?.playAsync()
    }
  }

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
    }
    setIsFullscreen(!isFullscreen)
  }

  const onLoad = (loadStatus: any) => {
    setStatus(loadStatus)
    setLoading(false)
    setError(null)
  }

  const onPlaybackStatusUpdate = (playbackStatus: any) => {
    setStatus(playbackStatus)

    if (playbackStatus.isLoaded && onProgress) {
      const currentTime = playbackStatus.positionMillis / 1000
      const duration = playbackStatus.durationMillis / 1000
      onProgress(currentTime, duration)
    }

    if (playbackStatus.error) {
      console.error("Video Error:", playbackStatus.error)
      setLoading(false)
      setError("Video playback failed. Try external player options.")
      showVideoErrorOptions()
    }
  }

  const showVideoErrorOptions = () => {
    Alert.alert("Video Playback Error", "Unable to play this video directly. Choose an option:", [
      {
        text: "Open in VLC",
        onPress: openInVLC,
      },
      {
        text: "Open in Browser",
        onPress: openInBrowser,
      },
      {
        text: "Copy URL",
        onPress: copyVideoUrl,
      },
      {
        text: "Share",
        onPress: shareVideo,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ])
  }

  const openInVLC = async () => {
    const vlcUrl = Platform.select({
      ios: `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(source.uri)}&filename=${encodeURIComponent(title)}`,
      android: `intent://${source.uri.replace(/^https?:\/\//, "")}#Intent;action=android.intent.action.VIEW;type=video/*;package=org.videolan.vlc;end`,
    })

    if (vlcUrl) {
      try {
        await Linking.openURL(vlcUrl)
      } catch {
        Alert.alert("VLC Not Found", "VLC Player is not installed. Would you like to download it?", [
          {
            text: "Download VLC",
            onPress: () => {
              const storeUrl = Platform.select({
                ios: "https://apps.apple.com/app/vlc-for-mobile/id650377962",
                android: "https://play.google.com/store/apps/details?id=org.videolan.vlc",
              })
              if (storeUrl) {
                Linking.openURL(storeUrl)
              }
            },
          },
          { text: "Cancel", style: "cancel" },
        ])
      }
    }
  }

  const openInBrowser = async () => {
    try {
      await Linking.openURL(source.uri)
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to open URL in browser",
      })
    }
  }

  const copyVideoUrl = async () => {
    await Clipboard.setStringAsync(source.uri)
    Toast.show({
      type: "success",
      text1: "URL Copied!",
      text2: "Video URL copied to clipboard",
    })
  }

  const shareVideo = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(source.uri, {
          dialogTitle: `Share ${title}`,
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const seekTo = async (value: number) => {
    const seekTime = (value / 100) * (status.durationMillis || 0)
    await videoRef.current?.setPositionAsync(seekTime)
  }

  const skipForward = async () => {
    const currentPosition = status.positionMillis || 0
    const newPosition = Math.min(currentPosition + 10000, status.durationMillis || 0)
    await videoRef.current?.setPositionAsync(newPosition)
  }

  const skipBackward = async () => {
    const currentPosition = status.positionMillis || 0
    const newPosition = Math.max(currentPosition - 10000, 0)
    await videoRef.current?.setPositionAsync(newPosition)
  }

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const containerStyle = isFullscreen ? styles.fullscreenContainer : styles.container

  return (
    <View style={containerStyle}>
      <StatusBar hidden={isFullscreen} />
      <TouchableOpacity style={styles.videoContainer} onPress={toggleControls} activeOpacity={1}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={source}
          useNativeControls={false}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onLoad={onLoad}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          volume={volume}
          rate={playbackRate}
          shouldPlay={false}
        />

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.errorButton} onPress={showVideoErrorOptions}>
              <Text style={styles.errorButtonText}>Show Options</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Video Controls */}
        {showControls && !error && (
          <>
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>
              <TouchableOpacity onPress={shareVideo} style={styles.shareButton}>
                <Ionicons name="share" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity onPress={skipBackward} style={styles.skipButton}>
                <Ionicons name="play-back" size={32} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                <Ionicons name={status.isPlaying ? "pause" : "play"} size={48} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={skipForward} style={styles.skipButton}>
                <Ionicons name="play-forward" size={32} color="white" />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <Text style={styles.timeText}>{formatTime(status.positionMillis || 0)}</Text>

              <Slider
                style={styles.progressSlider}
                minimumValue={0}
                maximumValue={100}
                value={status.durationMillis ? ((status.positionMillis || 0) / status.durationMillis) * 100 : 0}
                onValueChange={(value) => seekTo(value)}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbStyle={styles.sliderThumb}
              />

              <Text style={styles.timeText}>{formatTime(status.durationMillis || 0)}</Text>

              <TouchableOpacity onPress={toggleFullscreen} style={styles.fullscreenButton}>
                <Ionicons name={isFullscreen ? "contract" : "expand"} size={24} color="white" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    aspectRatio: 16 / 9,
  },
  fullscreenContainer: {
    backgroundColor: "black",
    width: screenHeight,
    height: screenWidth,
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1000,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.9)",
    padding: 20,
  },
  errorText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
  errorButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  errorButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  backButton: {
    padding: 5,
  },
  titleText: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 15,
  },
  shareButton: {
    padding: 5,
  },
  centerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    padding: 15,
    marginHorizontal: 20,
  },
  playButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 35,
    padding: 15,
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  timeText: {
    color: "white",
    fontSize: 12,
    minWidth: 50,
    textAlign: "center",
  },
  progressSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sliderThumb: {
    backgroundColor: theme.colors.primary,
    width: 15,
    height: 15,
  },
  fullscreenButton: {
    padding: 5,
    marginLeft: 10,
  },
})
