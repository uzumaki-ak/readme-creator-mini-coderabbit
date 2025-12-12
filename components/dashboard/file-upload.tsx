"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload as UploadIcon,
  Loader2,
  X,
  Github,
  File,
  Info,
} from "lucide-react";
import { File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function FileUpload() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"zip" | "github">("zip");

  // ZIP upload state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // GitHub state
  const [githubUrl, setGithubUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [useCustomToken, setUseCustomToken] = useState(false);
  const [githubError, setGithubError] = useState("");

  // Common state
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ZIP upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.endsWith(".zip")) {
        setFile(droppedFile);
        if (!projectName) {
          setProjectName(droppedFile.name.replace(".zip", ""));
        }
        setError(null);
      } else {
        setError("Please upload a ZIP file");
      }
    },
    [projectName]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile && selectedFile.name.endsWith(".zip")) {
        setFile(selectedFile);
        if (!projectName) {
          setProjectName(selectedFile.name.replace(".zip", ""));
        }
        setError(null);
      } else {
        setError("Please upload a ZIP file");
      }
    },
    [projectName]
  );

  // GitHub URL validation
  const validateGithubUrl = (
    url: string
  ): { valid: boolean; owner?: string; repo?: string } => {
    if (!url.trim()) return { valid: false };

    // Remove https://github.com/ prefix if present
    let cleanUrl = url
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^github\.com\//, "")
      .replace(/\.git$/, "");

    // Remove trailing slash
    cleanUrl = cleanUrl.replace(/\/$/, "");

    const parts = cleanUrl.split("/");
    if (parts.length === 2) {
      const [owner, repo] = parts;
      if (owner && repo && owner.length > 0 && repo.length > 0) {
        if (!projectName) {
          setProjectName(repo);
        }
        return { valid: true, owner, repo };
      }
    }

    return { valid: false };
  };

  const handleGithubUrlChange = (url: string) => {
    setGithubUrl(url);
    if (url.trim()) {
      const validation = validateGithubUrl(url);
      if (!validation.valid) {
        setGithubError(
          "Enter GitHub URL in format: username/repo or https://github.com/username/repo"
        );
      } else {
        setGithubError("");
      }
    } else {
      setGithubError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setError("Please provide a project name");
      return;
    }

    setIsUploading(true);
    setError(null);
    setGithubError("");

    try {
      let formData = new FormData();
      formData.append("name", projectName.trim());
      formData.append("description", description.trim());

      if (activeTab === "zip") {
        if (!file) {
          throw new Error("Please upload a ZIP file");
        }
        formData.append("file", file);
        formData.append("source", "zip");
      } else {
        // GitHub
        const validation = validateGithubUrl(githubUrl);
        if (!validation.valid) {
          throw new Error("Invalid GitHub URL. Use format: username/repo");
        }
        formData.append("githubUrl", githubUrl.trim());
        formData.append("source", "github");

        // Add GitHub token if provided
        if (useCustomToken && githubToken.trim()) {
          formData.append("githubToken", githubToken.trim());
        }
      }

      const response = await fetch("/api/projects/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      router.push(`/dashboard/projects/${data.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your project..."
              rows={3}
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "zip" | "github")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="zip" className="gap-2">
                <FileIcon className="h-4 w-4" />
                ZIP Upload
              </TabsTrigger>
              <TabsTrigger value="github" className="gap-2">
                <Github className="h-4 w-4" />
                GitHub
              </TabsTrigger>
            </TabsList>

            <TabsContent value="zip" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Project Files (ZIP)</Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                    file && "border-primary bg-primary/5"
                  )}
                >
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <FileIcon className="h-10 w-10 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="mt-2"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <UploadIcon className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Drop your ZIP file here</p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse (max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="github" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github-url">GitHub Repository</Label>
                  <div className="space-y-2">
                    <Input
                      id="github-url"
                      value={githubUrl}
                      onChange={(e) => handleGithubUrlChange(e.target.value)}
                      placeholder="username/repository or https://github.com/username/repository"
                    />
                    {githubError && (
                      <p className="text-sm text-destructive">{githubError}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <p>Examples:</p>
                      <ul className="mt-1 list-inside list-disc space-y-1">
                        <li>vercel/next.js</li>
                        <li>https://github.com/facebook/react</li>
                        <li>tailwindlabs/tailwindcss</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="use-token" className="cursor-pointer">
                        Use GitHub Token (Optional)
                      </Label>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                          >
                            <Info className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              About GitHub Tokens
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              <div className="space-y-2">
                                <p>GitHub tokens provide:</p>
                                <ul className="list-inside list-disc space-y-1">
                                  <li>
                                    Higher API rate limits (5,000 vs 60
                                    requests/hour)
                                  </li>
                                  <li>Access to private repositories</li>
                                  <li>
                                    Better reliability for large repositories
                                  </li>
                                </ul>
                                <p className="mt-2">
                                  <strong>Get a token:</strong>{" "}
                                  <a
                                    href="https://github.com/settings/tokens"
                                    target="_blank"
                                    className="text-primary underline"
                                    rel="noreferrer"
                                  >
                                    GitHub Settings → Developer Settings →
                                    Tokens
                                  </a>
                                </p>
                                <p className="text-sm mt-2">
                                  <strong>Note:</strong> Tokens are only used
                                  for this request and not stored.
                                </p>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogAction>Got it</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <input
                      type="checkbox"
                      id="use-token"
                      checked={useCustomToken}
                      onChange={(e) => setUseCustomToken(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  {useCustomToken && (
                    <div className="space-y-2">
                      <Input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Token starts with ghp_ or ghs_. Only used for this
                        clone, not stored.
                      </p>
                    </div>
                  )}

                  {!useCustomToken && (
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        <Info className="mr-1 inline h-4 w-4" />
                        Without a token, you have 60 requests/hour limit
                      </p>
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                        For large repositories or frequent use, consider adding
                        a token.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {(error || githubError) && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error || githubError}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {activeTab === "zip"
                  ? "Uploading & Processing..."
                  : "Cloning & Processing..."}
              </>
            ) : (
              <>
                {activeTab === "zip" ? (
                  <UploadIcon className="mr-2 h-4 w-4" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                {activeTab === "zip"
                  ? "Upload & Generate README"
                  : "Clone & Generate README"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
