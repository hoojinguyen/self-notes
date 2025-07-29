import React, { useState, useRef, useEffect } from 'react'
import { Search, X, FileText, Filter, SortAsc } from 'lucide-react'
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
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { searchNotes, clearSearch, searchResults, isSearching, highlightText } = useSearch()

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
      setSelectedIndex(0)
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

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchResults])

  const handleResultClick = (result: SearchResult) => {
    onResultSelect(result)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (searchResults[selectedIndex]) {
          handleResultClick(searchResults[selectedIndex])
        }
        break
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center pt-[10vh] z-50">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search notes, content, and more..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-12 pr-4 h-12 text-base bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-12 w-12 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="relevance">Most Relevant</option>
                <option value="date">Recently Modified</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filters.contentType}
                onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value as any }))}
                className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Content</option>
                <option value="text">Text Only</option>
                <option value="tasks">Tasks</option>
                <option value="links">Links</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto">
          {isSearching ? (
            <div className="p-12 text-center">
              <div className="relative mx-auto mb-6 w-12 h-12">
                <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Searching your notes...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <div
                  key={result.path}
                  className={`mx-2 mb-1 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-2 border-transparent'
                  }`}
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <h3 
                          className="font-semibold text-gray-900 dark:text-gray-100 truncate"
                          dangerouslySetInnerHTML={{ __html: highlightText(result.name, query) }}
                        />
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-3">
                        <span>{formatDate(result.updatedAt)}</span>
                        <span className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          Score: {result.score.toFixed(1)}
                        </span>
                      </div>
                      
                      {result.matches.slice(0, 2).map((match, matchIndex) => (
                        <div 
                          key={matchIndex}
                          className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2 last:mb-0"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightText(
                              match.text.length > 120 
                                ? match.text.substring(0, 120) + '...' 
                                : match.text, 
                              query
                            ) 
                          }}
                        />
                      ))}
                    </div>
                    
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                        {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No results found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Try different keywords or check your spelling</p>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">Search your notes</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Start typing to find notes, tasks, and content</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(searchResults.length > 0 || query.trim()) && (
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                {searchResults.length > 0 
                  ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found`
                  : 'No results'
                }
              </span>
              <div className="flex items-center gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
