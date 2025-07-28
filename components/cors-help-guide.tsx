"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Chrome, ChromeIcon as Firefox, Download, Globe } from "lucide-react"

export function CORSHelpGuide() {
  const extensions = [
    {
      name: "CORS Unblock",
      browser: "Chrome/Edge",
      icon: <Chrome className="w-4 h-4" />,
      url: "https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino",
      description: "Disable CORS restrictions for development",
    },
    {
      name: "CORS Everywhere",
      browser: "Firefox",
      icon: <Firefox className="w-4 h-4" />,
      url: "https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/",
      description: "Enable CORS for all websites",
    },
  ]

  const downloadManagers = [
    {
      name: "Internet Download Manager",
      platform: "Windows",
      url: "https://www.internetdownloadmanager.com/",
    },
    {
      name: "Free Download Manager",
      platform: "Cross-platform",
      url: "https://www.freedownloadmanager.org/",
    },
    {
      name: "JDownloader",
      platform: "Cross-platform",
      url: "https://jdownloader.org/",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Browser Extensions for CORS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {extensions.map((ext, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center gap-3">
                {ext.icon}
                <div>
                  <h4 className="text-white font-medium">{ext.name}</h4>
                  <p className="text-sm text-gray-400">{ext.description}</p>
                </div>
                <Badge variant="secondary">{ext.browser}</Badge>
              </div>
              <Button
                size="sm"
                onClick={() => window.open(ext.url, "_blank")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Install
              </Button>
            </div>
          ))}
          <div className="text-xs text-gray-400 p-2 bg-yellow-900/20 rounded border border-yellow-600/30">
            <strong>Warning:</strong> Only enable CORS extensions when needed and disable them afterward for security.
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Managers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {downloadManagers.map((dm, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div>
                <h4 className="text-white font-medium">{dm.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {dm.platform}
                </Badge>
              </div>
              <Button size="sm" onClick={() => window.open(dm.url, "_blank")} variant="outline">
                <ExternalLink className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
