import { Upload, Sparkles, Code, MessageSquare, Palette, Zap } from "lucide-react"

const features = [
  {
    icon: <Upload className="h-7 w-7 text-blue-600 dark:text-blue-400" />,
    title: "Upload your project",
    description: "Simply drag and drop your ZIP file or select it from your computer to get started.",
  },
  {
    icon: <Code className="h-7 w-7 text-blue-600 dark:text-blue-400" />,
    title: "AI analyzes code",
    description: "Our AI reads your files, understands structure, and identifies key components and patterns.",
  },
  {
    icon: <MessageSquare className="h-7 w-7 text-blue-600 dark:text-blue-400" />,
    title: "Refine with chat",
    description: "Use the project chatbot to ask questions and customize your README further.",
  },
  {
    icon: <Sparkles className="h-7 w-7 text-blue-600 dark:text-blue-400" />,
    title: "Code snippets & templates",
    description: "Easily insert project-specific sections and use pre-built templates.",
  },
  {
    icon: <Palette className="h-7 w-7 text-blue-600 dark:text-blue-400" />,
    title: "Customizable components",
    description: "Light and dark modes with flexible theme support and accessible styling variants.",
  },
  {
    icon: <Zap className="h-7 w-7 text-blue-600 dark:text-blue-400" />,
    title: "Responsive design",
    description: "Fully adaptable layout that works seamlessly on any device.",
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Powerful features for developers</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to generate beautiful, professional README files in minutes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">{feature.icon}</div>
              <h3 className="text-xl font-semibold mt-6 text-gray-900 dark:text-gray-100">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}