"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react"
import { File as FileIcon } from "lucide-react"
import type { FileNode } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FileTreeProps {
  nodes: FileNode[]
  onFileSelect?: (path: string) => void
  selectedPath?: string
}

export function FileTree({ nodes, onFileSelect, selectedPath }: FileTreeProps) {
  return (
    <div className="text-sm">
      {nodes.map((node) => (
        <FileTreeNode key={node.path} node={node} onFileSelect={onFileSelect} selectedPath={selectedPath} depth={0} />
      ))}
    </div>
  )
}

interface FileTreeNodeProps {
  node: FileNode
  onFileSelect?: (path: string) => void
  selectedPath?: string
  depth: number
}

function FileTreeNode({ node, onFileSelect, selectedPath, depth }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const isDirectory = node.type === "directory"
  const isSelected = selectedPath === node.path

  const handleClick = () => {
    if (isDirectory) {
      setIsOpen(!isOpen)
    } else {
      onFileSelect?.(node.path)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "flex w-full items-center gap-1 rounded px-2 py-1 text-left transition-colors hover:bg-muted",
          isSelected && "bg-primary/10 text-primary",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isDirectory ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            {isOpen ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-primary" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDirectory && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}