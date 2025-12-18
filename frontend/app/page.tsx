import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, Zap, Check, Star } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-background" />
            </div>
            <span className="font-semibold text-lg">AdGen</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm mb-6">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Design Engine</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 text-balance">
            AI-Powered Ad Creatives in Seconds
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 text-balance leading-relaxed">
            Generate high-performing social media ad creatives based on real market trends. Create 3-5 variations in
            seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8 h-12">
                Start Generating
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base px-8 h-12 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Image Placeholder */}
      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border/50 bg-card shadow-lg overflow-hidden">
            <img
              src="/modern-ad-creative-dashboard-interface.jpg"
              alt="Ad Creative Dashboard"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Ads Generated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">2.5x</div>
              <div className="text-sm text-muted-foreground">Average CTR Boost</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Create stunning ad creatives in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Enter Your Details</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Input your industry, platform, brand name, headline, and upload your product image.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Generates Designs</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our AI analyzes trends and creates 3-5 unique ad variations optimized for your platform.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Download & Launch</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Download your favorite designs and launch campaigns that drive real results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose AdGen?</h2>
            <p className="text-lg text-muted-foreground">Powered by data-driven insights and cutting-edge AI</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Trend-Aware Design</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI analyzes current market trends to generate designs that resonate with your target audience.
              </p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3-5 Creative Variations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get multiple high-quality variations instantly. Test different approaches to find what works best.
              </p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Data-Driven Layouts</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every design is optimized using proven patterns that drive engagement and conversions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Marketers</h2>
            <p className="text-lg text-muted-foreground">See what our customers have to say</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-foreground text-foreground" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                "This tool saved me hours of design work. The AI-generated ads perform better than what our design team
                used to create manually."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div>
                  <div className="font-semibold text-sm">Sarah Johnson</div>
                  <div className="text-xs text-muted-foreground">Marketing Director, TechCorp</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-foreground text-foreground" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                "The trend-aware designs really stand out. Our CTR increased by 2.8x after switching to AdGen."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div>
                  <div className="font-semibold text-sm">Michael Chen</div>
                  <div className="text-xs text-muted-foreground">Founder, StyleHub</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-foreground text-foreground" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                "A game changer for our agency. We can now deliver more variations to clients in a fraction of the
                time."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div>
                  <div className="font-semibold text-sm">Emily Rodriguez</div>
                  <div className="text-xs text-muted-foreground">Creative Lead, Pulse Media</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Features */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-foreground to-foreground/90 rounded-2xl p-12 md:p-16 text-background">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Ready to Create Stunning Ads?</h2>
              <p className="text-lg text-background/80 mb-8 text-balance">
                Join hundreds of marketers who are already creating high-performing ads with AI
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Unlimited Generations</div>
                  <div className="text-sm text-background/70">Create as many ad variations as you need</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Trend Analysis</div>
                  <div className="text-sm text-background/70">AI analyzes current market trends</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Multiple Platforms</div>
                  <div className="text-sm text-background/70">Instagram, Facebook, TikTok support</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold mb-1">High-Quality Exports</div>
                  <div className="text-sm text-background/70">Download in multiple formats</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base px-8 h-12 bg-background text-foreground hover:bg-background/90"
                >
                  Start Creating Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Everything you need to know</p>
          </div>
          <div className="space-y-6">
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">How many ad variations can I generate?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI generates 3-5 unique variations for each input, giving you multiple options to test and optimize
                your campaigns.
              </p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">What platforms are supported?</h3>
              <p className="text-muted-foreground leading-relaxed">
                We currently support Instagram, Facebook, and TikTok. Each design is optimized for the platform's
                specifications and best practices.
              </p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Can I use my own product images?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Yes! Simply upload your product image during the generation process, and our AI will incorporate it into
                your ad designs.
              </p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">How does the trend analysis work?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI constantly analyzes current market trends, successful ad patterns, and platform-specific
                engagement data to create designs that resonate with your target audience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-background" />
              </div>
              <span className="font-semibold">AdGen</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground">© 2025 AdGen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
