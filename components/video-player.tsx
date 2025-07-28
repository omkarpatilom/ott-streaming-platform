"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface VideoPlayerProps {
  src: string
  title: string
  onProgress?: (currentTime: number, duration: number) => void
}

export function VideoPlayer({ src, title, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [videoError, setVideoError] = useState<string | null>(null)

  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onProgress?.(video.currentTime, video.duration)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("volumechange", handleVolumeChange)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("volumechange", handleVolumeChange)
    }
  }, [onProgress])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0]
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (isFullscreen) {
        await document.exitFullscreen()
      } else {
        await container.requestFullscreen()
      }
    } catch (error) {
      console.error("Fullscreen error:", error)
    }
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
  }

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setPlaybackRate(rate)
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const handleMouseMove = () => {
    showControlsTemporarily()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case " ":
        e.preventDefault()
        togglePlay()
        break
      case "ArrowLeft":
        e.preventDefault()
        skip(-10)
        break
      case "ArrowRight":
        e.preventDefault()
        skip(10)
        break
      case "ArrowUp":
        e.preventDefault()
        handleVolumeChange([Math.min(1, volume + 0.1)])
        break
      case "ArrowDown":
        e.preventDefault()
        handleVolumeChange([Math.max(0, volume - 0.1)])
        break
      case "f":
        e.preventDefault()
        toggleFullscreen()
        break
      case "m":
        e.preventDefault()
        toggleMute()
        break
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const duration = video.duration
        if (duration > 0) {
          setBuffered((bufferedEnd / duration) * 100)
        }
      }
    }

    video.addEventListener("progress", handleProgress)
    return () => video.removeEventListener("progress", handleProgress)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleError = () => {
      setVideoError("Failed to load video. Please check the URL or try again.")
      setIsLoading(false)
    }

    const handleCanPlay = () => {
      setVideoError(null)
      setIsLoading(false)
    }

    video.addEventListener("error", handleError)
    video.addEventListener("canplay", handleCanPlay)

    return () => {
      video.removeEventListener("error", handleError)
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [src])

  const testVideoUrl = async (url: string) => {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
      })
      return true
    } catch (error) {
      console.warn("URL test failed:", error)
      return false
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black group ${isFullscreen ? "w-screen h-screen" : "aspect-video"}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        preload="none"
        crossOrigin="anonymous"
        playsInline
        controls={false}
        style={{ backgroundColor: "#000" }}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => {
          setIsLoading(false)
          setVideoError(null)
        }}
        onError={(e) => {
          console.error("Video error:", e)
          setVideoError("Failed to load video. This might be due to CORS restrictions or an invalid URL.")
          setIsLoading(false)
        }}
        onLoadedData={() => {
          setIsLoading(false)
          setVideoError(null)
        }}
      />

      {(isLoading || videoError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
          <div className="text-center max-w-md p-6">
            {videoError ? (
              <div className="text-red-400">
                <div className="text-lg mb-4">⚠️ Video Loading Error</div>
                <div className="text-sm mb-4 text-gray-300">{videoError}</div>
                <div className="text-xs text-gray-400 mb-4">
                  Common solutions:
                  <ul className="list-disc list-inside mt-2 text-left">
                    <li>Check if the video URL is accessible</li>
                    <li>Try refreshing the page</li>
                    <li>The server might have CORS restrictions</li>
                    <li>URL might be expired or moved</li>
                  </ul>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => {
                      setVideoError(null)
                      setIsLoading(true)
                      if (videoRef.current) {
                        videoRef.current.load()
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Retry
                  </Button>
                  <Button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.src = src + "?t=" + Date.now()
                        videoRef.current.load()
                      }
                      setVideoError(null)
                      setIsLoading(true)
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Force Reload
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <div className="text-lg">Loading video...</div>
                <div className="text-sm text-gray-400 mt-2">Please wait while we load the content</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="relative">
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-red-500 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-red-500 [&_[role=slider]:focus-visible]:ring-0 [&_[role=slider]:focus-visible]:ring-offset-0"
            />
            {/* Buffer progress indicator */}
            <div
              className="absolute top-0 h-1 bg-white/50 rounded-full pointer-events-none"
              style={{ width: `${buffered}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="text-white hover:bg-white/20">
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-white hover:bg-white/20">
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 ml-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
                />
              </div>
            </div>

            <div className="text-white text-sm ml-4">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <div className="px-2 py-1 text-sm text-white font-medium">Playback Speed</div>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`text-white hover:bg-slate-700 ${playbackRate === rate ? "bg-slate-700" : ""}`}
                  >
                    {rate}x {rate === 1 && "(Normal)"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Title Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <h2 className="text-white text-lg font-medium">{title}</h2>
      </div>
    </div>
  )
}
