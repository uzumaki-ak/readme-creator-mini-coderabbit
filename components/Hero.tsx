import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-gray-900 dark:text-gray-100">
          Professional READMEs
          <br />
          <span className="text-blue-600 dark:text-blue-400">generated instantly</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8">
          A modern, Next.js-powered web application that helps developers craft comprehensive and professional README
          files with ease. Built with intuitive UI components and intelligent AI analysis.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white gap-2">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 bg-transparent dark:bg-transparent">
              Learn more
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}