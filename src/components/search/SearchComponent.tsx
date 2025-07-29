import React, { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSearch } from '@/hooks/useSearch'
import type { SearchResult, SearchFilters } from '@/hooks/useSearch'

interface SearchComponentProps {
  onResultSelect: (result: SearchResult) => void
  isOpen: boolean
  onClose: () => void
}

export function SearchComponent({ onResultSelect, isOpen, onClose }: SearchComponentProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance',
    contentType: 'all'
  })
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { searchNotes, clearSearch, searchResults, isSearching, highlightText } = useSearch()

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchNotes(query, filters)
      } else {
        clearSearch()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, filters, searchNotes, clearSearch])

  const handleResultClick = (result: SearchResult) => {
    onResultSelect(result)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search notes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="title">Title</option>
            </select>

            <select
              value={filters.contentType}
              onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value as any }))}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="all">All Types</option>
              <option value="text">Text Only</option>
              <option value="tasks">Tasks</option>
              <option value="links">Links</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map((result) => (
                <div
                  key={result.path}
                  className="p-4 hover:bg-muted/50 cursor-pointer border-l-2 border-transparent hover:border-primary transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 
                        className="font-medium text-foreground"
                        dangerouslySetInnerHTML={{ __html: highlightText(result.name, query) }}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(result.updatedAt)} • Score: {result.score}
                      </div>
                      
                      {result.matches.slice(0, 1).map((match, matchIndex) => (
                        <div 
                          key={matchIndex}
                          className="text-sm text-muted-foreground mt-1"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightText(
                              match.text.length > 100 
                                ? match.text.substring(0, 100) + '...' 
                                : match.text, 
                              query
                            ) 
                          }}
                        />
                      ))}
                    </div>
                    
                    <div className="text-xs text-muted-foreground ml-4">
                      {result.matches.length} matches
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Start typing to search your notes...
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="p-2 border-t text-xs text-muted-foreground text-center">
            {searchResults.length} results found
          </div>
        )}
      </div>
    </div>
  )
}
