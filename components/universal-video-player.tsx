"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, Download, Copy, AlertTriangle, Smartphone, Monitor } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Video.js will be loaded dynamically
declare global {
  interface Window {
    videojs: any
  }
}

interface UniversalVideoPlayerProps {
  src: string
  title: string
  startTime?: number
  onProgress?: (currentTime: number, duration: number) => void
}

export function UniversalVideoPlayer({ src, title, startTime = 0, onProgress }: UniversalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const { toast } = useToast()

  const [isVideoJsLoaded, setIsVideoJsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent)

    setIsMobile(isMobileDevice)
    setIsIOS(isIOSDevice)

    // Load Video.js dynamically
    loadVideoJS()
  }, [])

  const loadVideoJS = async () => {
    try {
      // Load Video.js CSS
      if (!document.querySelector('link[href*="video-js.css"]')) {
        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.href = "https://vjs.zencdn.net/8.12.0/video-js.css"
        document.head.appendChild(cssLink)
      }

      // Load Video.js JavaScript
      if (!window.videojs) {
        const script = document.createElement("script")
        script.src = "https://vjs.zencdn.net/8.12.0/video.min.js"
        script.onload = () => {
          setIsVideoJsLoaded(true)
          initializePlayer()
        }
        script.onerror = () => {
          console.error("Failed to load Video.js")
          setVideoError("Failed to load video player. Using fallback options.")
          setShowFallback(true)
          setIsLoading(false)
        }
        document.head.appendChild(script)
      } else {
        setIsVideoJsLoaded(true)
        initializePlayer()
      }
    } catch (error) {
      console.error("Error loading Video.js:", error)
      setVideoError("Video player failed to load. Using fallback options.")
      setShowFallback(true)
      setIsLoading(false)
    }
  }

  const initializePlayer = () => {
    if (!videoRef.current || !window.videojs) return

    try {
      // Video.js configuration optimized for mobile
      const options = {
        controls: true,
        responsive: true,
        fluid: true,
        playsinline: true,
        preload: "metadata",
        html5: {
          vhs: {
            overrideNative: !isIOS, // Use native HLS on iOS
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
        techOrder: ["html5"],
        sources: [
          {
            src: src,
            type: getVideoType(src),
          },
        ],
        // Mobile-specific options
        ...(isMobile && {
          playsinline: true,
          muted: false, // Don't auto-mute on mobile
          autoplay: false,
          controls: true,
          fluid: true,
          responsive: true,
        }),
        // iOS-specific options
        ...(isIOS && {
          playsinline: true,
          webkit: {
            playsinline: true,
          },
        }),
      }

      // Initialize Video.js player
      playerRef.current = window.videojs(videoRef.current, options, () => {
        console.log("Video.js player ready")
        setPlayerReady(true)
        setIsLoading(false)
        setVideoError(null)

        // Set start time if provided
        if (startTime > 0) {
          playerRef.current.currentTime(startTime)
        }

        // Add event listeners
        playerRef.current.on("timeupdate", () => {
          const currentTime = playerRef.current.currentTime()
          const duration = playerRef.current.duration()
          if (onProgress && duration > 0) {
            onProgress(currentTime, duration)
          }
        })

        playerRef.current.on("error", (error: any) => {
          console.error("Video.js error:", error)
          const errorCode = playerRef.current.error()?.code
          let errorMessage = "Video playback failed."

          switch (errorCode) {
            case 1:
              errorMessage = "Video loading was aborted."
              break
            case 2:
              errorMessage = "Network error occurred while loading video."
              break
            case 3:
              errorMessage = "Video format not supported."
              break
            case 4:
              errorMessage = "Video source not found."
              break
            default:
              errorMessage = isMobile
                ? "Mobile playback restricted. Try the options below."
                : "Video playback failed. Try alternative options."
          }

          setVideoError(errorMessage)
          setShowFallback(true)
        })

        playerRef.current.on("loadstart", () => {
          setIsLoading(true)
          setVideoError(null)
        })

        playerRef.current.on("canplay", () => {
          setIsLoading(false)
          setVideoError(null)
          setShowFallback(false)
        })

        playerRef.current.on("waiting", () => {
          setIsLoading(true)
        })

        playerRef.current.on("playing", () => {
          setIsLoading(false)
        })
      })
    } catch (error) {
      console.error("Error initializing Video.js:", error)
      setVideoError("Video player initialization failed. Using fallback options.")
      setShowFallback(true)
      setIsLoading(false)
    }
  }

  const getVideoType = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "mp4":
        return "video/mp4"
      case "webm":
        return "video/webm"
      case "mkv":
        return "video/x-matroska"
      case "m3u8":
        return "application/x-mpegURL"
      default:
        return "video/mp4"
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
      }
    }
  }, [])

  const openInBrowser = () => {
    window.open(src, "_blank", "noopener,noreferrer")
    toast({
      title: "Opening in new tab",
      description: "Video will open in a new browser tab",
    })
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(src)
      toast({
        title: "✅ URL Copied!",
        description: "Open your video app and paste the URL",
      })
    } catch (error) {
      // Fallback for older browsers
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
          description: "Open your video app and paste the URL",
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

    if (isIOS) {
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

  const openInVLC = () => {
    if (isIOS) {
      const vlcUrl = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(src)}&filename=${encodeURIComponent(title)}`
      window.location.href = vlcUrl
      setTimeout(() => {
        if (confirm("VLC not installed? Download from App Store?")) {
          window.open("https://apps.apple.com/app/vlc-for-mobile/id650377962", "_blank")
        }
      }, 2000)
    } else {
      const vlcIntent = `intent://${src.replace(/^https?:\/\//, "")}#Intent;action=android.intent.action.VIEW;type=video/*;package=org.videolan.vlc;end`
      window.location.href = vlcIntent
      setTimeout(() => {
        window.open("https://play.google.com/store/apps/details?id=org.videolan.vlc", "_blank")
      }, 2000)
    }
  }

  const retryVideoJS = () => {
    setVideoError(null)
    setShowFallback(false)
    setIsLoading(true)

    if (playerRef.current) {
      playerRef.current.dispose()
      playerRef.current = null
    }

    setTimeout(() => {
      initializePlayer()
    }, 500)
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Video.js Player */}
      <div className={`${showFallback ? "hidden" : "block"}`}>
        <div data-vjs-player>
          <video
            ref={videoRef}
            className="video-js vjs-default-skin w-full aspect-video"
            data-setup="{}"
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !showFallback && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <div className="text-white text-lg">Loading Video Player...</div>
            <div className="text-gray-400 text-sm mt-2">
              {isMobile ? "Optimizing for mobile..." : "Preparing video..."}
            </div>
          </div>
        </div>
      )}

      {/* Fallback Options */}
      {(showFallback || videoError) && (
        <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-800/95 border-slate-700 backdrop-blur">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {isMobile ? (
                    <Smartphone className="w-8 h-8 text-blue-400" />
                  ) : (
                    <Monitor className="w-8 h-8 text-blue-400" />
                  )}
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">Video Player Issue Detected</p>
              </div>

              {/* Error Message */}
              <div className="mb-6 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
                <div className="text-xs text-yellow-200">
                  <p className="font-medium mb-1">⚠️ Playback Issue:</p>
                  <p>{videoError || "Video player failed to load. Choose an alternative below."}</p>
                </div>
              </div>

              {/* Alternative Options */}
              <div className="space-y-3">
                {/* Retry Video.js */}
                {!showFallback && (
                  <Button onClick={retryVideoJS} className="w-full bg-red-600 hover:bg-red-700">
                    🔄 Retry Video Player
                  </Button>
                )}

                {/* Browser Option */}
                <Button
                  onClick={openInBrowser}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-left justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Open in New Tab</div>
                      <div className="text-xs opacity-80">
                        {isMobile ? "Best for mobile browsers" : "Direct browser playback"}
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
                      <div className="font-medium">Open in VLC Player</div>
                      <div className="text-xs opacity-80">Universal video player - All formats supported</div>
                    </div>
                  </div>
                </Button>

                {/* Copy URL */}
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-left justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <Copy className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Copy Video URL</div>
                      <div className="text-xs opacity-80">Use with any video app or player</div>
                    </div>
                  </div>
                </Button>

                {/* Download */}
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
                        {isIOS ? "Save to Files for offline viewing" : "Download for offline viewing"}
                      </div>
                    </div>
                  </div>
                </Button>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-3 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-gray-400">
                  <div className="font-medium mb-2 text-gray-300">
                    {isMobile ? "📱 Mobile Solutions:" : "💻 Desktop Solutions:"}
                  </div>
                  <ul className="space-y-1">
                    {isMobile ? (
                      <>
                        <li>• New Tab: Works on most mobile browsers</li>
                        <li>• VLC: Best mobile video player</li>
                        <li>• Copy URL: Use with MX Player, Kodi, etc.</li>
                        <li>• Enable "Desktop Site" in browser settings</li>
                      </>
                    ) : (
                      <>
                        <li>• New Tab: Direct browser playback</li>
                        <li>• VLC: Professional desktop player</li>
                        <li>• Copy URL: Use with any media player</li>
                        <li>• Try different browser if issues persist</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom Video.js Styles */}
      <style jsx global>{`
        .video-js {
          width: 100% !important;
          height: auto !important;
          aspect-ratio: 16/9;
        }

        .video-js .vjs-big-play-button {
          background-color: rgba(239, 68, 68, 0.8) !important;
          border: none !important;
          border-radius: 50% !important;
          width: 80px !important;
          height: 80px !important;
          line-height: 80px !important;
          margin-top: -40px !important;
          margin-left: -40px !important;
        }

        .video-js .vjs-big-play-button:hover {
          background-color: rgba(239, 68, 68, 1) !important;
        }

        .video-js .vjs-control-bar {
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent) !important;
          height: 60px !important;
        }

        .video-js .vjs-progress-control {
          height: 6px !important;
        }

        .video-js .vjs-play-progress {
          background-color: #ef4444 !important;
        }

        .video-js .vjs-volume-level {
          background-color: #ef4444 !important;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .video-js .vjs-big-play-button {
            width: 60px !important;
            height: 60px !important;
            line-height: 60px !important;
            margin-top: -30px !important;
            margin-left: -30px !important;
          }

          .video-js .vjs-control-bar {
            height: 50px !important;
          }

          .video-js .vjs-button {
            padding: 0 8px !important;
          }
        }
      `}</style>
    </div>
  )
}
