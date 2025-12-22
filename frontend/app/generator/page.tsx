"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Upload, X, Download, ArrowLeft, Loader2, History, Layout } from "lucide-react"
import { logEvent, generateDesigns } from "@/lib/api"

interface GeneratedDesign {
  id: string
  url: string
  variation: number
}

const adTemplates = [
  { id: "minimal", name: "Minimal", description: "Clean and modern" },
  { id: "bold", name: "Bold", description: "High contrast and vibrant" },
  { id: "elegant", name: "Elegant", description: "Sophisticated and refined" },
  { id: "playful", name: "Playful", description: "Fun and energetic" },
]

export default function GeneratorPage() {
  const [industry, setIndustry] = useState("")
  const [platform, setPlatform] = useState("")
  const [brandName, setBrandName] = useState("")
  const [headline, setHeadline] = useState("")
  const [ctaText, setCtaText] = useState("")
  const [productImage, setProductImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<Array<{ id: string; timestamp: Date; designs: GeneratedDesign[] }>>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setProductImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      logEvent("image_selected", { name: file.name, size: file.size, type: file.type })
    }
  }

  const handleRemoveImage = () => {
    setProductImage(null)
    setImagePreview(null)
    logEvent("image_removed")
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    logEvent("generate_submitted", { industry, platform, brandName, hasImage: !!productImage, template: selectedTemplate })

    try {
      // Create FormData
      const formData = new FormData()
      formData.append("industry", industry)
      formData.append("platform", platform)
      formData.append("brandName", brandName)
      formData.append("headline", headline)
      formData.append("ctaText", ctaText)
      if (productImage) {
        formData.append("productImage", productImage)
      }
      if (selectedTemplate) {
        formData.append("template", selectedTemplate)
      }

      // Call real API
      const result = await generateDesigns(formData)
      
      // Transform response to GeneratedDesign format
      const designs: GeneratedDesign[] = result.images.map((imagePath: string, index: number) => ({
        id: `${result.requestId}-${index + 1}`,
        url: imagePath,
        variation: index + 1
      }))

      setGeneratedDesigns(designs)
      setHistory((prev) => [{ id: result.requestId, timestamp: new Date(), designs }, ...prev])
      logEvent("generate_completed", { count: designs.length, requestId: result.requestId })
      
    } catch (error) {
      console.error("Generation error:", error)
      alert(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (design: GeneratedDesign) => {
    // Mock download functionality
    console.log("Downloading design:", design.id)
    logEvent("download", { designId: design.id, variation: design.variation })
  }

  const handleReset = () => {
    setGeneratedDesigns([])
  }

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    // In real implementation, this would set style preferences
    console.log("Applied template:", templateId)
    logEvent("template_applied", { templateId })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-background" />
            </div>
            <span className="font-semibold text-lg">AdGen</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                try { localStorage.removeItem('token') } catch {}
                logEvent('logout')
                window.location.href = '/'
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {showHistory ? (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3">Generation History</h1>
                <p className="text-lg text-muted-foreground">View all your previously generated ads</p>
              </div>
              <Button variant="outline" onClick={() => setShowHistory(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Generator
              </Button>
            </div>

            {history.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-xl p-16 text-center">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
                <p className="text-muted-foreground mb-6">Generate your first ad to see it here</p>
                <Button onClick={() => setShowHistory(false)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Generating
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {history.map((item) => (
                  <div key={item.id} className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                    <div className="mb-4">
                      <div className="text-sm text-muted-foreground">
                        {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {item.designs.map((design) => (
                        <div key={design.id} className="aspect-square rounded-lg overflow-hidden border border-border">
                          <img
                            src={design.url.startsWith('/outputs') ? `http://localhost:5000${design.url}` : design.url || "/placeholder.svg"}
                            alt={`Variation ${design.variation}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : generatedDesigns.length === 0 ? (
          /* Generator Form */
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-3">Generate Ad Creatives</h1>
              <p className="text-lg text-muted-foreground">Fill in the details below to create stunning ad designs</p>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Choose a Style Template (Optional)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {adTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:border-foreground/50 ${
                      selectedTemplate === template.id ? "border-foreground bg-muted" : "border-border/50 bg-card"
                    }`}
                  >
                    <div className="font-semibold mb-1">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm">
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry} required>
                      <SelectTrigger id="industry" className="h-11">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                        <SelectItem value="beauty">Beauty</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={platform} onValueChange={setPlatform} required>
                      <SelectTrigger id="platform" className="h-11">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    type="text"
                    placeholder="Your Brand"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    type="text"
                    placeholder="Your compelling headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ctaText">Call to Action</Label>
                  <Input
                    id="ctaText"
                    type="text"
                    placeholder="Shop Now"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Product Image</Label>
                  {!imagePreview ? (
                    <label
                      htmlFor="productImage"
                      className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload product image</span>
                      <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</span>
                      <input
                        id="productImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        required
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Product preview"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1 bg-background/80 backdrop-blur rounded-full hover:bg-background transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Designs...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Designs
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3">Your Generated Designs</h1>
                <p className="text-lg text-muted-foreground">Download your favorites and test them out</p>
              </div>
              <Button variant="outline" onClick={handleReset}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Generate Again
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {generatedDesigns.map((design) => (
                <div
                  key={design.id}
                  className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={design.url.startsWith('/outputs') ? `http://localhost:5000${design.url}` : design.url || "/placeholder.svg"}
                      alt={`Variation ${design.variation}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">Variation {design.variation}</span>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(design)}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
