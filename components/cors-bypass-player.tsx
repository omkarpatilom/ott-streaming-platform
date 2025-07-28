"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Download, Copy, AlertTriangle, Monitor, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CORSBypassPlayerProps {
  src: string
  title: string
  onProgress?: (currentTime: number, duration: number) => void
}

export function CORSBypassPlayer({ src, title, onProgress }: CORSBypassPlayerProps) {
  const [playerMode, setPlayerMode] = useState<"proxy" | "external" | "download" | "embed">("proxy")
  const [isLoading, setIsLoading] = useState(false)
  const [proxyUrl, setProxyUrl] = useState("")
  const { toast } = useToast()

  // CORS proxy services (free alternatives)
  const corsProxies = [
    "https://cors-anywhere.herokuapp.com/",
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://proxy.cors.sh/",
  ]

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually",
        variant: "destructive",
      })
    }
  }

  const openInNewTab = () => {
    window.open(src, "_blank")
  }

  const openWithProxy = (proxyService: string) => {
    const proxiedUrl = proxyService + encodeURIComponent(src)
    window.open(proxiedUrl, "_blank")
  }

  const generateDownloadLink = () => {
    // Create a download link that forces download
    const link = document.createElement("a")
    link.href = src
    link.download = title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".mkv"
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const EmbedPlayer = () => (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={src}
        className="w-full h-full"
        allowFullScreen
        style={{ border: "none" }}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
    </div>
  )

  const ProxyPlayer = () => {
    const [selectedProxy, setSelectedProxy] = useState(corsProxies[0])

    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={selectedProxy + encodeURIComponent(src)}
            className="w-full h-full"
            controls
            preload="metadata"
            onLoadStart={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              toast({
                title: "Proxy failed",
                description: "Try a different proxy service or external player",
                variant: "destructive",
              })
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-400">Try different proxy:</span>
          {corsProxies.map((proxy, index) => (
            <Button
              key={index}
              size="sm"
              variant={selectedProxy === proxy ? "default" : "outline"}
              onClick={() => setSelectedProxy(proxy)}
              className="text-xs"
            >
              Proxy {index + 1}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* CORS Warning */}
      <Card className="bg-yellow-900/20 border-yellow-600/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            CORS Restriction Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-200 text-sm mb-4">
            The video server has blocked direct playback due to CORS policy. Choose an alternative method below:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              size="sm"
              variant={playerMode === "external" ? "default" : "outline"}
              onClick={() => setPlayerMode("external")}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              External
            </Button>
            <Button
              size="sm"
              variant={playerMode === "proxy" ? "default" : "outline"}
              onClick={() => setPlayerMode("proxy")}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              <Globe className="w-4 h-4 mr-1" />
              Proxy
            </Button>
            <Button
              size="sm"
              variant={playerMode === "embed" ? "default" : "outline"}
              onClick={() => setPlayerMode("embed")}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              <Monitor className="w-4 h-4 mr-1" />
              Embed
            </Button>
            <Button
              size="sm"
              variant={playerMode === "download" ? "default" : "outline"}
              onClick={() => setPlayerMode("download")}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Player Content */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-white text-lg font-medium mb-4">{title}</h3>

        {playerMode === "external" && (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ExternalLink className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-white mb-4">Open video in external player</p>
                <div className="space-y-2">
                  <Button onClick={openInNewTab} className="bg-red-600 hover:bg-red-700 w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(src)}
                    variant="outline"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Video URL
                  </Button>
                </div>
              </div>
            </div>

            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-4">
                <h4 className="text-white font-medium mb-2">Recommended External Players:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="text-gray-300">
                    <strong>Desktop:</strong> VLC, MPV, PotPlayer
                  </div>
                  <div className="text-gray-300">
                    <strong>Mobile:</strong> VLC, MX Player, Kodi
                  </div>
                  <div className="text-gray-300">
                    <strong>Browser:</strong> Copy URL to address bar
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {playerMode === "proxy" && <ProxyPlayer />}

        {playerMode === "embed" && (
          <div className="space-y-4">
            <EmbedPlayer />
            <p className="text-sm text-gray-400">
              If the embed doesn't work, the server may not allow iframe embedding.
            </p>
          </div>
        )}

        {playerMode === "download" && (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-white mb-4">Download video for offline viewing</p>
                <div className="space-y-2">
                  <Button onClick={generateDownloadLink} className="bg-green-600 hover:bg-green-700 w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Video
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(src)}
                    variant="outline"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Download URL
                  </Button>
                </div>
              </div>
            </div>

            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-4">
                <h4 className="text-white font-medium mb-2">Download Instructions:</h4>
                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Click "Download Video" to attempt direct download</li>
                  <li>If blocked, copy the URL and paste it into a download manager</li>
                  <li>Use tools like IDM, wget, or curl for reliable downloads</li>
                  <li>Some servers may require specific headers or user agents</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Alternative Solutions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Alternative Solutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-white font-medium mb-2">Quick Access Methods:</h4>
              <div className="space-y-2">
                {corsProxies.slice(0, 2).map((proxy, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onClick={() => openWithProxy(proxy)}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 w-full justify-start"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Open with Proxy {index + 1}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">Browser Extensions:</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• CORS Unblock (Chrome/Edge)</p>
                <p>• CORS Everywhere (Firefox)</p>
                <p>• Video DownloadHelper</p>
                <p>• Stream Recorder</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-gray-400">
              <strong>Note:</strong> CORS restrictions are set by the video server to prevent unauthorized embedding.
              These methods provide legitimate ways to access the content while respecting server policies.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
