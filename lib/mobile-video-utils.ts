export interface MobileVideoCapabilities {
  canPlayMP4: boolean
  canPlayWebM: boolean
  canPlayMKV: boolean
  supportsHLS: boolean
  supportsAutoplay: boolean
  requiresUserGesture: boolean
  browserName: string
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
}

export function detectMobileVideoCapabilities(): MobileVideoCapabilities {
  const userAgent = navigator.userAgent
  const video = document.createElement("video")

  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isAndroid = /Android/.test(userAgent)

  // Detect browser
  let browserName = "Unknown"
  if (userAgent.includes("Chrome")) browserName = "Chrome"
  else if (userAgent.includes("Firefox")) browserName = "Firefox"
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browserName = "Safari"
  else if (userAgent.includes("Edge")) browserName = "Edge"

  // Test video format support
  const canPlayMP4 = video.canPlayType("video/mp4") !== ""
  const canPlayWebM = video.canPlayType("video/webm") !== ""
  const canPlayMKV = video.canPlayType("video/x-matroska") !== ""

  // Test HLS support
  const supportsHLS =
    video.canPlayType("application/vnd.apple.mpegurl") !== "" || video.canPlayType("application/x-mpegURL") !== ""

  // Mobile devices typically require user gesture for autoplay
  const requiresUserGesture = isMobile || isIOS

  // Autoplay support is limited on mobile
  const supportsAutoplay = !isMobile && !isIOS

  return {
    canPlayMP4,
    canPlayWebM,
    canPlayMKV,
    supportsHLS,
    supportsAutoplay,
    requiresUserGesture,
    browserName,
    isMobile,
    isIOS,
    isAndroid,
  }
}

export function getMobileVideoRecommendations(capabilities: MobileVideoCapabilities): string[] {
  const recommendations = []

  if (capabilities.isMobile) {
    recommendations.push("Use VLC or MX Player for best compatibility")
    recommendations.push("Copy URL and open in dedicated video app")

    if (capabilities.isIOS) {
      recommendations.push("Try Infuse or PlayerXtreme Media Player")
      recommendations.push("Enable 'Request Desktop Website' in Safari")
    }

    if (capabilities.isAndroid) {
      recommendations.push("Use Chrome browser for better video support")
      recommendations.push("Try BSPlayer or KMPlayer")
    }

    if (!capabilities.canPlayMKV) {
      recommendations.push("MKV files may not play directly - use external app")
    }

    recommendations.push("Download video for offline viewing if streaming fails")
  }

  return recommendations
}

export function generateVideoAppIntents(videoUrl: string, title: string) {
  const encodedUrl = encodeURIComponent(videoUrl)
  const encodedTitle = encodeURIComponent(title)

  return {
    // Android intents
    vlcAndroid: `intent://${videoUrl.replace(/^https?:\/\//, "")}#Intent;action=android.intent.action.VIEW;type=video/*;package=org.videolan.vlc;end`,
    mxPlayerAndroid: `intent://${videoUrl.replace(/^https?:\/\//, "")}#Intent;action=android.intent.action.VIEW;type=video/*;package=com.mxtech.videoplayer.ad;end`,

    // iOS URL schemes (limited support)
    vlcIOS: `vlc-x-callback://x-callback-url/stream?url=${encodedUrl}&filename=${encodedTitle}`,
    infuseIOS: `infuse://x-callback-url/play?url=${encodedUrl}`,

    // Universal fallbacks
    browserFallback: videoUrl,
    downloadLink: videoUrl,
  }
}
