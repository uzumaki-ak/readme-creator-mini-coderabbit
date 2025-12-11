import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  FileText,
  Upload,
  MessageSquare,
  Zap,
  Settings,
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Documentation
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about using README Generator
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="getting-started" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto">
              <TabsTrigger value="getting-started" className="text-sm">
                Getting Started
              </TabsTrigger>
              <TabsTrigger value="features" className="text-sm">
                Features
              </TabsTrigger>
              <TabsTrigger value="api" className="text-sm">
                API
              </TabsTrigger>
              <TabsTrigger value="tech-stack" className="text-sm">
                Tech Stack
              </TabsTrigger>
              <TabsTrigger value="configuration" className="text-sm">
                Configuration
              </TabsTrigger>
              <TabsTrigger value="contributing" className="text-sm">
                Contributing
              </TabsTrigger>
            </TabsList>

            {/* Getting Started */}
            <TabsContent value="getting-started" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Start
                  </CardTitle>
                  <CardDescription>
                    Get up and running in minutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">1. Sign Up</h3>
                    <p className="text-muted-foreground">
                      Create your free account to get started with README
                      Generator.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      2. Upload Your Project
                    </h3>
                    <p className="text-muted-foreground">
                      Upload your project as a ZIP file. Our AI will analyze the
                      structure and contents.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      3. Generate README
                    </h3>
                    <p className="text-muted-foreground">
                      Click generate and watch as AI creates a comprehensive
                      README file for your project.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      4. Refine with Chat
                    </h3>
                    <p className="text-muted-foreground">
                      Use the project chat to ask questions and customize your
                      README further.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Installation (For Developers)
                  </CardTitle>
                  <CardDescription>Run locally on your machine</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Clone the repository:
                    </p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm">
                        {`git clone https://github.com/uzumaki-ak/readme-creator-mini-coderabbit.git
cd readme-creator-mini-coderabbit
npm install`}
                      </code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Start the development server:
                    </p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm">npm run dev</code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Open your browser and navigate to{" "}
                      <code className="bg-muted px-2 py-1 rounded">
                        http://localhost:3000
                      </code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features */}
            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Core Features</CardTitle>
                  <CardDescription>
                    Powerful tools to create professional documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold">File Upload</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload projects as ZIP files. Supports all common file
                        types and structures.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold">AI Analysis</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Intelligent code analysis to understand your project
                        structure and dependencies.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold">Project Chat</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Interactive chat to refine your README and ask
                        project-specific questions.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold">Live Preview</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Real-time markdown preview with syntax highlighting and
                        formatting.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>UI Components</CardTitle>
                  <CardDescription>
                    Modern, accessible components built with Radix UI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <li>• Accordion menus</li>
                    <li>• Dialog modals</li>
                    <li>• Dropdown menus</li>
                    <li>• Badges & labels</li>
                    <li>• Form components</li>
                    <li>• Cards & sheets</li>
                    <li>• Tabs navigation</li>
                    <li>• Toast notifications</li>
                    <li>• Theme toggle</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Documentation */}
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Routes</CardTitle>
                  <CardDescription>
                    RESTful API endpoints for project management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">
                      POST /api/projects/upload
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a project ZIP file
                    </p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm">
                        {`// Request
Content-Type: multipart/form-data
Body: { file: File }

// Response
{
  "projectId": "uuid",
  "name": "project-name",
  "files": [...],
  "structure": {...}
}`}
                      </code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">
                      POST /api/projects/[id]/generate
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Generate README content for a project
                    </p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm">
                        {`// Request
Content-Type: application/json
Body: { projectId: "uuid" }

// Response
{
  "readme": "# Generated README content...",
  "sections": [...]
}`}
                      </code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">
                      POST /api/projects/[id]/chat
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Chat with AI about your project
                    </p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm">
                        {`// Request
Content-Type: application/json
Body: { message: "string" }

// Response (Streaming)
Text stream of AI response`}
                      </code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tech Stack */}
            <TabsContent value="tech-stack" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technology Stack</CardTitle>
                  <CardDescription>
                    Modern tools and frameworks powering README Generator
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold mb-3">Frontend</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                          • <strong>Next.js 16</strong> - React framework with
                          App Router
                        </li>
                        <li>
                          • <strong>TypeScript</strong> - Type-safe development
                        </li>
                        <li>
                          • <strong>Tailwind CSS</strong> - Utility-first
                          styling
                        </li>
                        <li>
                          • <strong>Radix UI</strong> - Accessible component
                          primitives
                        </li>
                        <li>
                          • <strong>Lucide React</strong> - Beautiful icon
                          library
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Backend</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                          • <strong>Next.js API Routes</strong> - Serverless
                          functions
                        </li>
                        <li>
                          • <strong>Supabase</strong> - Database &
                          authentication
                        </li>
                        <li>
                          • <strong>AI Integration</strong> - Claude/Gemini for
                          analysis
                        </li>
                        <li>
                          • <strong>File Processing</strong> - ZIP handling &
                          parsing
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Development</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                          • <strong>React Hook Form</strong> - Form validation
                        </li>
                        <li>
                          • <strong>React Markdown</strong> - Markdown rendering
                        </li>
                        <li>
                          • <strong>PostCSS</strong> - CSS processing
                        </li>
                        <li>
                          • <strong>ESLint</strong> - Code quality
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Deployment</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                          • <strong>Vercel</strong> - Hosting platform
                        </li>
                        <li>
                          • <strong>Vercel Analytics</strong> - Performance
                          monitoring
                        </li>
                        <li>
                          • <strong>Environment Variables</strong> - Secure
                          config
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuration */}
            <TabsContent value="configuration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Environment Setup
                  </CardTitle>
                  <CardDescription>
                    Configure your local development environment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">
                      Environment Variables
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create a{" "}
                      <code className="bg-muted px-2 py-1 rounded">
                        .env.local
                      </code>{" "}
                      file in the root directory:
                    </p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm">
                        {`NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ANTHROPIC_API_KEY=your-claude-api-key
GEMINI_API_KEY=your-gemini-api-key`}
                      </code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Supabase Setup</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Create a new project on Supabase</li>
                      <li>Copy your project URL and anon key</li>
                      <li>
                        Run the SQL migrations from the{" "}
                        <code className="bg-muted px-1 rounded">supabase/</code>{" "}
                        folder
                      </li>
                      <li>Enable authentication providers if needed</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Database Schema</h3>
                    <p className="text-sm text-muted-foreground">
                      The application uses three main tables:{" "}
                      <code className="bg-muted px-1 rounded">projects</code>,
                      <code className="bg-muted px-1 rounded mx-1">
                        project_files
                      </code>
                      , and
                      <code className="bg-muted px-1 rounded ml-1">
                        chat_messages
                      </code>
                      . SQL migrations are provided in the repository.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contributing */}
            <TabsContent value="contributing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contributing Guidelines</CardTitle>
                  <CardDescription>
                    Help make README Generator better
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">How to Contribute</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Fork the repository on GitHub</li>
                      <li>Clone your fork locally</li>
                      <li>
                        Create a new branch:{" "}
                        <code className="bg-muted px-1 rounded">
                          git checkout -b feature/your-feature
                        </code>
                      </li>
                      <li>Make your changes and test thoroughly</li>
                      <li>
                        Commit with clear messages:{" "}
                        <code className="bg-muted px-1 rounded">
                          git commit -m "Add feature"
                        </code>
                      </li>
                      <li>
                        Push to your fork:{" "}
                        <code className="bg-muted px-1 rounded">
                          git push origin feature/your-feature
                        </code>
                      </li>
                      <li>Open a Pull Request on the main repository</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Code Style</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        • Follow the existing TypeScript and React patterns
                      </li>
                      <li>• Use Tailwind CSS for styling</li>
                      <li>
                        • Ensure components are accessible (ARIA attributes)
                      </li>
                      <li>• Write clear comments for complex logic</li>
                      <li>
                        • Run{" "}
                        <code className="bg-muted px-1 rounded">
                          npm run lint
                        </code>{" "}
                        before committing
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Reporting Issues</h3>
                    <p className="text-sm text-muted-foreground">
                      Found a bug or have a feature request? Open an issue on
                      GitHub with:
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground mt-2">
                      <li>• Clear description of the problem/feature</li>
                      <li>• Steps to reproduce (for bugs)</li>
                      <li>• Expected vs actual behavior</li>
                      <li>• Screenshots if applicable</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">GitHub:</span>
                    <a
                      href="https://github.com/uzumaki-ak/readme-creator-mini-coderabbit"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      uzumaki-ak/readme-creator-mini-coderabbit
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">License:</span>
                    <span>MIT License</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
