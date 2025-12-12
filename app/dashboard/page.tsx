import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { FileUpload } from "@/components/dashboard/file-upload";
import { ProjectList } from "@/components/dashboard/project-list";
import type { Project } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  UploadCloud,
  FolderOpen,
  Sparkles,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";

// Add this function near the top of your file, after imports
const getRandomEmoji = () => {
  const emojis = [
    "🚀",
    "✨",
    "🌟",
    "💫",
    "🔥",
    "🎯",
    "💡",
    "⚡",
    "🌈",
    "🎨",
    "👨‍💻",
    "🤖",
    "👾",
    "💻",
    "📱",
    "🔧",
    "🔨",
    "⚙️",
    "🧠",
    "🎪",
    "🎭",
    "🎪",
    "🤯",
    "🥳",
    "🤩",
    "😎",
    "🧐",
    "🤓",
    "😤",
    "😈",
  ];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const totalProjects = projects?.length || 0;
  const recentProjects = projects?.slice(0, 3) || [];
  const hasGeneratedReadme =
    projects?.filter((p) => p.generated_readme).length || 0;

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <DashboardHeader user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back, {user.email?.split("@")[0]}!
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Transform your projects with AI-powered README generation
              </p>
            </div>
            <div className="hidden rounded-full bg-linear-to-r from-primary/10 to-blue-500/10 p-3 sm:block">
              <span className="text-sm">{getRandomEmoji()}</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="group overflow-hidden border-border/50 bg-linear-to-br from-background to-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Projects
                    </p>
                    <p className="mt-2 text-3xl font-bold">{totalProjects}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-3 transition-transform duration-300 group-hover:scale-110">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Manage all your repositories</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden border-border/50 bg-linear-to-br from-background to-card transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      READMEs Generated
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                      {hasGeneratedReadme}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 p-3 transition-transform duration-300 group-hover:scale-110">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>AI-powered documentation</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden border-border/50 bg-linear-to-br from-background to-card transition-all duration-300 hover:border-green-500/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Recent Activity
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                      {recentProjects.length}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-500/10 p-3 transition-transform duration-300 group-hover:scale-110">
                    <Clock className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Last 3 projects</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden border-border/50 bg-linear-to-br from-background to-card transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Ready to Create
                    </p>
                    <p className="mt-2 text-3xl font-bold">New</p>
                  </div>
                  <div className="rounded-lg bg-purple-500/10 p-3 transition-transform duration-300 group-hover:scale-110">
                    <UploadCloud className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Upload your next project</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 overflow-hidden border-0 bg-linear-to-br from-card to-background shadow-xl transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-linear-to-r from-primary/5 to-primary/10 p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <UploadCloud className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">New Project</h2>
                      <p className="text-sm text-muted-foreground">
                        Upload a ZIP or connect Git
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <FileUpload />
                  <div className="mt-6 rounded-lg bg-muted/30 p-4">
                    <h3 className="mb-2 text-sm font-medium">
                      Supported Formats
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        <span>GitHub repositories</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        <span>ZIP files (max 50MB)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        <span>All programming languages</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Your Projects</h2>
                  <p className="mt-1 text-muted-foreground">
                    {totalProjects === 0
                      ? "No projects yet. Upload your first project!"
                      : `Manage ${totalProjects} project${
                          totalProjects === 1 ? "" : "s"
                        }`}
                  </p>
                </div>
                {totalProjects > 0 && (
                  <div className="hidden rounded-full bg-linear-to-r from-primary/10 to-primary/5 px-4 py-2 text-sm font-medium sm:block">
                    <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      {totalProjects} total
                    </span>
                  </div>
                )}
              </div>
            </div>

            <ProjectList projects={(projects as Project[]) || []} />

            {totalProjects === 0 && (
              <Card className="overflow-hidden border-dashed border-primary/30 bg-linear-to-br from-background to-primary/5">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <FolderOpen className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">
                    No projects yet
                  </h3>
                  <p className="mb-6 text-muted-foreground">
                    Get started by uploading your first project to generate an
                    AI-powered README
                  </p>
                  <div className="animate-pulse">
                    <UploadCloud className="mx-auto h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-12">
          <h3 className="mb-6 text-center text-lg font-semibold">
            How It Works
          </h3>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 text-lg font-medium">Upload Project</h4>
                <p className="text-sm text-muted-foreground">
                  Upload your project files or connect your GitHub repository in
                  seconds
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-lg">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-lg bg-blue-500/10 p-3">
                  <Sparkles className="h-6 w-6 text-blue-500" />
                </div>
                <h4 className="mb-2 text-lg font-medium">AI Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes your code structure, dependencies, and
                  architecture
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-green-500/30 hover:shadow-lg">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-br from-green-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-lg bg-green-500/10 p-3">
                  <FileText className="h-6 w-6 text-green-500" />
                </div>
                <h4 className="mb-2 text-lg font-medium">Get README</h4>
                <p className="text-sm text-muted-foreground">
                  Receive a comprehensive, professional README file tailored to
                  your project
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
