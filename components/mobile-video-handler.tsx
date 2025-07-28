"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Download, Copy, Play, AlertTriangle, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MobileVideoHandlerProps {
  src: string
  title: string
  onFallback?: () => void
}

export function MobileVideoHandler({ src, title, onFallback }: MobileVideoHandlerProps) {
  const { toast } = useToast()
  const [isMobile, setIsMobile] = useState(false)
  const [browserInfo, setBrowserInfo] = useState("")

  useEffect(() => {
    // Detect mobile and browser
    const userAgent = navigator.userAgent
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    setIsMobile(isMobileDevice)

    // Detect browser
    let browser = "Unknown"
    if (userAgent.includes("Chrome")) browser = "Chrome"
    else if (userAgent.includes("Firefox")) browser = "Firefox"
    else if (userAgent.includes("Safari")) browser = "Safari"
    else if (userAgent.includes("Edge")) browser = "Edge"

    setBrowserInfo(browser)
  }, [])

  const openInNewTab = () => {
    try {
      // Try to open in new tab with specific parameters for mobile
      const newWindow = window.open(src, "_blank", "noopener,noreferrer,width=800,height=600")
      if (!newWindow) {
        // Fallback if popup blocked
        window.location.href = src
      }
    } catch (error) {
      window.location.href = src
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(src)
      toast({
        title: "URL Copied! 📋",
        description: "Open your favorite video app and paste the URL",
      })
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = src
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)

      toast({
        title: "URL Copied! 📋",
        description: "Open your favorite video app and paste the URL",
      })
    }
  }

  const downloadVideo = () => {
    try {
      const link = document.createElement("a")
      link.href = src
      link.download = title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".mkv"
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      // Fallback - just open the URL
      window.open(src, "_blank")
    }
  }

  const openWithIntent = () => {
    if (isMobile) {
      // Try Android intent for video apps
      const intentUrl = `intent://${src.replace(/^https?:\/\//, "")}#Intent;action=android.intent.action.VIEW;type=video/*;end`
      window.location.href = intentUrl

      // Fallback after a delay
      setTimeout(() => {
        openInNewTab()
      }, 2000)
    } else {
      openInNewTab()
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700 max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-blue-400" />
          Mobile Video Player
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Choose the best option for your device ({browserInfo} on {isMobile ? "Mobile" : "Desktop"})
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Options */}
        <div className="space-y-3">
          <Button onClick={openWithIntent} className="w-full bg-blue-600 hover:bg-blue-700 text-left justify-start">
            <Play className="w-4 h-4 mr-3" />
            <div>
              <div className="font-medium">Open in Video App</div>
              <div className="text-xs opacity-80">Best for mobile devices</div>
            </div>
          </Button>

          <Button
            onClick={openInNewTab}
            variant="outline"
            className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-left justify-start"
          >
            <ExternalLink className="w-4 h-4 mr-3" />
            <div>
              <div className="font-medium">Open in Browser</div>
              <div className="text-xs opacity-80">Direct browser playback</div>
            </div>
          </Button>

          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-left justify-start"
          >
            <Copy className="w-4 h-4 mr-3" />
            <div>
              <div className="font-medium">Copy URL</div>
              <div className="text-xs opacity-80">For VLC, MX Player, etc.</div>
            </div>
          </Button>

          <Button
            onClick={downloadVideo}
            variant="outline"
            className="w-full bg-green-700 border-green-600 text-white hover:bg-green-600 text-left justify-start"
          >
            <Download className="w-4 h-4 mr-3" />
            <div>
              <div className="font-medium">Download Video</div>
              <div className="text-xs opacity-80">Save for offline viewing</div>
            </div>
          </Button>
        </div>

        {/* Mobile-specific instructions */}
        {isMobile && (
          <div className="mt-6 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-200">
                <div className="font-medium mb-1">Mobile Playback Tips:</div>
                <ul className="space-y-1 text-blue-300">
                  <li>• Try "Open in Video App" first</li>
                  <li>• Use VLC or MX Player for best results</li>
                  <li>• Enable "Desktop site" in browser settings</li>
                  <li>• Download if streaming fails</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Apps */}
        <div className="mt-4 p-3 bg-slate-900 rounded-lg">
          <div className="text-white font-medium text-sm mb-2">📱 Recommended Apps:</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
            <div>
              <div className="font-medium">Android:</div>
              <div>VLC, MX Player, BSPlayer</div>
            </div>
            <div>
              <div className="font-medium">iOS:</div>
              <div>VLC, Infuse, PlayerXtreme</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
