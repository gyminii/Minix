"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  File,
  FileText,
  Film,
  Music,
  Archive,
  Trash2,
  Download,
  Share2,
  ChevronRight,
  ImageIcon
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(type: string) {
  switch (type) {
    case "image":
      return <ImageIcon className="size-4" />;
    case "video":
      return <Film className="size-4" />;
    case "audio":
      return <Music className="size-4" />;
    case "archive":
      return <Archive className="size-4" />;
    case "document":
      return <FileText className="size-4" />;
    default:
      return <File className="size-4" />;
  }
}

const files = [
  {
    id: 1,
    name: "project-proposal.docx",
    type: "document",
    size: 2500000,
    uploadDate: new Date(2025, 3, 15)
  },
  {
    id: 2,
    name: "company-logo.png",
    type: "image",
    size: 1200000,
    uploadDate: new Date(2025, 3, 14)
  },
  {
    id: 3,
    name: "presentation.pptx",
    type: "document",
    size: 5600000,
    uploadDate: new Date(2025, 3, 13)
  },
  { id: 4, name: "budget.xlsx", type: "document", size: 980000, uploadDate: new Date(2025, 2, 12) },
  {
    id: 5,
    name: "product-video.mp4",
    type: "video",
    size: 158000000,
    uploadDate: new Date(2025, 3, 11)
  }
];

export function TableRecentFiles() {
  const [fileList, setFileList] = useState(files);

  const deleteFile = (id: number) => {
    setFileList(fileList.filter((file) => file.id !== id));
  };

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>Recently Uploaded Files</CardTitle>
        <CardAction className="relative">
          <div className="absolute end-0 top-0">
            <Button variant="outline">
              <span className="hidden lg:inline">View All</span>
              <ChevronRight />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="lg:w-[300px]">Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fileList.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary flex items-center space-x-2 hover:underline">
                    {getFileIcon(file.type)}
                    <span>{file.name}</span>
                  </Link>
                </TableCell>
                <TableCell>{formatFileSize(file.size)}</TableCell>
                <TableCell>{format(file.uploadDate, "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download />
                        <span>Download</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 />
                        <span>Share</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteFile(file.id)}>
                        <Trash2 />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
