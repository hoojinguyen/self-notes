import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface FileEntry {
  name: string;
  path: string;
  isFolder: boolean;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
  children?: FileEntry[];
}

export function buildFileTree(entries: FileEntry[]): FileEntry[] {
  const map = new Map<string, FileEntry>();
  const tree: FileEntry[] = [];

  // Sort entries by path depth to ensure parents are processed first
  const sortedEntries = entries.sort((a, b) => {
    const aDepth = a.path.split('/').length;
    const bDepth = b.path.split('/').length;
    return aDepth - bDepth;
  });

  for (const entry of sortedEntries) {
    map.set(entry.path, { ...entry, children: [] });
  }

  for (const entry of sortedEntries) {
    const item = map.get(entry.path)!;
    const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
    
    if (parentPath && map.has(parentPath)) {
      const parent = map.get(parentPath)!;
      parent.children!.push(item);
    } else {
      tree.push(item);
    }
  }

  return tree;
}

export function sortFileEntries(entries: FileEntry[], sortBy: 'name' | 'date' = 'name'): FileEntry[] {
  return entries.sort((a, b) => {
    // Folders first
    if (a.isFolder !== b.isFolder) {
      return a.isFolder ? -1 : 1;
    }

    if (sortBy === 'date') {
      const aDate = a.updatedAt || a.createdAt || new Date(0);
      const bDate = b.updatedAt || b.createdAt || new Date(0);
      return bDate.getTime() - aDate.getTime();
    }

    return a.name.localeCompare(b.name);
  });
}

export function getFileExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.') + 1);
}

export function removeFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
}
