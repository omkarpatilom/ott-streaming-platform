"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, ExternalLink, Download, Copy, Smartphone, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MobileVideoPlayerProps {
  src: string
  title: string
  startTime?: number
  onProgress?: (currentTime: number, duration: number) => void
}

export function MobileVideoPlayer({ src, title, startTime = 0, onProgress }: MobileVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)
  const [showNativePlayer, setShowNativePlayer] = useState(false)

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent)

    setIsMobile(isMobileDevice)
    setIsIOS(isIOSDevice)

    // For mobile devices, show mobile-friendly options immediately
    if (isMobileDevice) {
      setIsLoading(false)
      setVideoError("Mobile device detected. Choose your preferred playback method below.")
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !showNativePlayer) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
      if (startTime > 0) {
        video.currentTime = startTime
        setCurrentTime(startTime)
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onProgress?.(video.currentTime, video.duration)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleError = () => {
      setVideoError("Video playback failed. Please try the mobile options below.")
      setIsLoading(false)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      setVideoError(null)
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("error", handleError)
    video.addEventListener("canplay", handleCanPlay)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("error", handleError)
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [onProgress, startTime, showNativePlayer])

  const openInSafari = () => {
    // For iPhone, open directly in Safari
    window.open(src, "_blank")

    toast({
      title: "Opening in Safari",
      description: "Video will open in a new Safari tab for better mobile playback",
    })
  }

  const openInVLC = () => {
    if (isIOS) {
      // VLC iOS URL scheme
      const vlcUrl = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(src)}&filename=${encodeURIComponent(title)}`
      window.location.href = vlcUrl

      // Fallback to App Store if VLC not installed
      setTimeout(() => {
        if (confirm("VLC not installed? Would you like to download it from the App Store?")) {
          window.open("https://apps.apple.com/app/vlc-for-mobile/id650377962", "_blank")
        }
      }, 2000)
    } else {
      // Android VLC intent
      const vlcIntent = `intent://${src.replace(/^https?:\/\//, "")}#Intent;action=android.intent.action.VIEW;type=video/*;package=org.videolan.vlc;end`
      window.location.href = vlcIntent

      // Fallback to Play Store
      setTimeout(() => {
        window.open("https://play.google.com/store/apps/details?id=org.videolan.vlc", "_blank")
      }, 2000)
    }
  }

  const openInInfuse = () => {
    if (isIOS) {
      const infuseUrl = `infuse://x-callback-url/play?url=${encodeURIComponent(src)}`
      window.location.href = infuseUrl

      setTimeout(() => {
        if (confirm("Infuse not installed? Would you like to download it from the App Store?")) {
          window.open("https://apps.apple.com/app/infuse-7/id1136220934", "_blank")
        }
      }, 2000)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(src)
      toast({
        title: "✅ URL Copied!",
        description: "Now open your video app and paste the URL",
      })
    } catch (error) {
      // Fallback for older iOS versions
      const textArea = document.createElement("textarea")
      textArea.value = src
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand("copy")
        toast({
          title: "✅ URL Copied!",
          description: "Now open your video app and paste the URL",
        })
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Please copy the URL manually",
          variant: "destructive",
        })
      }

      document.body.removeChild(textArea)
    }
  }

  const downloadVideo = () => {
    const link = document.createElement("a")
    link.href = src
    link.download = title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".mp4"
    link.target = "_blank"
    link.rel = "noopener noreferrer"

    // For iOS, we need to handle this differently
    if (isIOS) {
      // iOS doesn't support direct downloads, so open in new tab
      window.open(src, "_blank")
      toast({
        title: "Opening video...",
        description: "Long press the video and select 'Save to Files' to download",
      })
    } else {
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: "Video download has been initiated",
      })
    }
  }

  const tryNativePlayer = () => {
    setShowNativePlayer(true)
    setVideoError(null)
    setIsLoading(true)
    setUserInteracted(true)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Native Video Player (hidden by default on mobile) */}
      {showNativePlayer && (
        <video
          ref={videoRef}
          src={src}
          className="w-full aspect-video"
          controls
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="metadata"
          style={{ backgroundColor: "#000" }}
        />
      )}

      {/* Mobile-First Interface */}
      {(!showNativePlayer || videoError || isLoading) && (
        <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
          <Card className="w-full max-w-md bg-slate-800/90 border-slate-700 backdrop-blur">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Smartphone className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{isIOS ? "iPhone/iPad" : "Mobile"} Video Player</p>
              </div>

              {/* Status Message */}
              <div className="mb-6 p-3 bg-blue-900/30 border border-blue-600/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-200">
                    <p className="font-medium mb-1">
                      {isIOS ? "📱 iPhone Optimized Playback" : "📱 Mobile Playback Options"}
                    </p>
                    <p>
                      {isIOS
                        ? "Choose the best option for your iPhone. Safari or VLC recommended."
                        : "Select your preferred video player for the best experience."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Playback Options */}
              <div className="space-y-3">
                {/* Safari/Browser Option (Best for iPhone) */}
                <Button
                  onClick={openInSafari}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-left justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{isIOS ? "Open in Safari" : "Open in Browser"}</div>
                      <div className="text-xs opacity-80">
                        {isIOS ? "Best for iPhone - Full screen support" : "Direct browser playback"}
                      </div>
                    </div>
                  </div>
                </Button>

                {/* VLC Option */}
                <Button
                  onClick={openInVLC}
                  variant="outline"
                  className="w-full bg-orange-700/20 border-orange-600/50 text-white hover:bg-orange-700/30 text-left justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-xs font-bold">
                      VLC
                    </div>
                    <div>
                      <div className="font-medium">Open in VLC</div>
                      <div className="text-xs opacity-80">Professional video player - Supports all formats</div>
                    </div>
                  </div>
                </Button>

                {/* Infuse Option (iOS only) */}
                {isIOS && (
                  <Button
                    onClick={openInInfuse}
                    variant="outline"
                    className="w-full bg-purple-700/20 border-purple-600/50 text-white hover:bg-purple-700/30 text-left justify-start h-auto py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center text-xs font-bold">
                        INF
                      </div>
                      <div>
                        <div className="font-medium">Open in Infuse</div>
                        <div className="text-xs opacity-80">Premium iOS video player</div>
                      </div>
                    </div>
                  </Button>
                )}

                {/* Copy URL Option */}
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-left justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <Copy className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Copy Video URL</div>
                      <div className="text-xs opacity-80">For any video app - Paste in your favorite player</div>
                    </div>
                  </div>
                </Button>

                {/* Download Option */}
                <Button
                  onClick={downloadVideo}
                  variant="outline"
                  className="w-full bg-green-700/20 border-green-600/50 text-white hover:bg-green-700/30 text-left justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{isIOS ? "Save Video" : "Download Video"}</div>
                      <div className="text-xs opacity-80">
                        {isIOS ? "Save to Files app for offline viewing" : "Download for offline viewing"}
                      </div>
                    </div>
                  </div>
                </Button>

                {/* Try Native Player (fallback) */}
                {!showNativePlayer && (
                  <Button
                    onClick={tryNativePlayer}
                    variant="outline"
                    size="sm"
                    className="w-full bg-slate-800 border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Try Built-in Player
                  </Button>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-6 p-3 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-gray-400">
                  <div className="font-medium mb-2 text-gray-300">
                    {isIOS ? "📱 iPhone Instructions:" : "📱 Mobile Instructions:"}
                  </div>
                  <ul className="space-y-1">
                    {isIOS ? (
                      <>
                        <li>• Safari: Best for direct playback</li>
                        <li>• VLC: Download from App Store if needed</li>
                        <li>• Copy URL: Paste in any video app</li>
                        <li>• For downloads: Long press → Save to Files</li>
                      </>
                    ) : (
                      <>
                        <li>• Browser: Direct playback</li>
                        <li>• VLC/MX Player: Best compatibility</li>
                        <li>• Copy URL: Use with any video app</li>
                        <li>• Download: Save for offline viewing</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* App Store Links */}
              {isIOS && (
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => window.open("https://apps.apple.com/app/vlc-for-mobile/id650377962", "_blank")}
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    Get VLC
                  </Button>
                  <Button
                    onClick={() => window.open("https://apps.apple.com/app/infuse-7/id1136220934", "_blank")}
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    Get Infuse
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Native Player Controls (if showing) */}
      {showNativePlayer && !videoError && !isLoading && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur rounded-lg p-3">
          <div className="flex items-center justify-between text-white text-sm">
            <span>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={openInSafari} className="bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="w-3 h-3 mr-1" />
                Safari
              </Button>
              <Button
                size="sm"
                onClick={copyToClipboard}
                variant="outline"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                📋
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
