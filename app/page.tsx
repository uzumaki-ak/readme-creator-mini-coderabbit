import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Upload, Sparkles, MessageSquare, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-lg font-bold">ReadmeGen</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Generate beautiful READMEs with AI
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              Upload your project, and let AI analyze your code to create comprehensive, professional documentation in
              seconds.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="gap-2">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">How it works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Three simple steps to transform your codebase into well-documented projects.
            </p>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Upload your project</h3>
                <p className="mt-2 text-muted-foreground">
                  Simply drag and drop your ZIP file or select it from your computer.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">AI analyzes your code</h3>
                <p className="mt-2 text-muted-foreground">
                  Our AI reads your files, understands the structure, and identifies key components.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Refine with chat</h3>
                <p className="mt-2 text-muted-foreground">
                  Use the project chatbot to ask questions and customize your README further.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="mt-4 text-muted-foreground">Join developers who save hours on documentation.</p>
            <Link href="/auth/sign-up" className="mt-8 inline-block">
              <Button size="lg">Create your first README</Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ReadmeGen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
