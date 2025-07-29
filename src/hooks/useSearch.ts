import { useState, useCallback } from 'react'
import { getAllNotes } from '@/lib/database/client'

export interface SearchResult {
  path: string
  name: string
  content: string
  createdAt: Date
  updatedAt: Date
  matches: Array<{
    type: 'title' | 'content'
    text: string
    index: number
    length: number
  }>
  score: number
}

export interface SearchFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  contentType?: 'all' | 'tasks' | 'links' | 'text'
  sortBy?: 'relevance' | 'date' | 'title'
}

export function useSearch() {
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const highlightText = useCallback((text: string, query: string): string => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }, [])

  const scoreMatch = useCallback((content: string, title: string, query: string): number => {
    const queryLower = query.toLowerCase()
    const titleLower = title.toLowerCase()
    const contentLower = content.toLowerCase()
    
    let score = 0
    
    // Title matches are worth more
    if (titleLower.includes(queryLower)) {
      score += 10
      if (titleLower.startsWith(queryLower)) {
        score += 5  // Exact start match bonus
      }
    }
    
    // Content matches
    const contentMatches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length
    score += contentMatches * 1
    
    // Boost for exact word matches
    const exactWordRegex = new RegExp(`\\b${queryLower}\\b`, 'g')
    const exactMatches = (contentLower.match(exactWordRegex) || []).length
    score += exactMatches * 2
    
    return score
  }, [])

  const findMatches = useCallback((text: string, query: string, type: 'title' | 'content') => {
    const matches = []
    const queryLower = query.toLowerCase()
    const textLower = text.toLowerCase()
    
    let index = textLower.indexOf(queryLower)
    while (index !== -1) {
      matches.push({
        type,
        text: text.substring(Math.max(0, index - 50), index + query.length + 50),
        index,
        length: query.length
      })
      index = textLower.indexOf(queryLower, index + 1)
    }
    
    return matches
  }, [])

  const searchNotes = useCallback(async (query: string, filters: SearchFilters = {}) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchQuery('')
      return
    }

    setIsSearching(true)
    setSearchQuery(query)

    try {
      const notes = await getAllNotes()
      
      const results: SearchResult[] = notes
        .filter(note => {
          if (!note.content && !note.name) return false
          
          const content = note.content || ''
          const title = note.name || ''
          const searchText = `${title} ${content}`.toLowerCase()
          const queryLower = query.toLowerCase()
          
          // Basic text match
          if (!searchText.includes(queryLower)) return false
          
          // Date range filter
          if (filters.dateRange) {
            const noteDate = note.updatedAt || note.createdAt
            if (noteDate) {
              const date = new Date(noteDate)
              if (date < filters.dateRange.start || date > filters.dateRange.end) {
                return false
              }
            }
          }
          
          // Content type filter
          if (filters.contentType && filters.contentType !== 'all') {
            switch (filters.contentType) {
              case 'tasks':
                if (!content.includes('- [ ]') && !content.includes('- [x]')) return false
                break
              case 'links':
                if (!content.includes('http') && !content.includes('[') && !content.includes('](')) return false
                break
              case 'text':
                if (content.includes('- [ ]') || content.includes('- [x]') || content.includes('http')) return false
                break
            }
          }
          
          return true
        })
        .map(note => {
          const content = note.content || ''
          const title = note.name || ''
          
          const titleMatches = findMatches(title, query, 'title')
          const contentMatches = findMatches(content, query, 'content')
          const score = scoreMatch(content, title, query)
          
          return {
            path: note.path,
            name: title,
            content,
            createdAt: note.createdAt || new Date(),
            updatedAt: note.updatedAt || new Date(),
            matches: [...titleMatches, ...contentMatches.slice(0, 3)], // Limit content matches
            score
          }
        })
        .sort((a, b) => {
          switch (filters.sortBy) {
            case 'date':
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            case 'title':
              return a.name.localeCompare(b.name)
            case 'relevance':
            default:
              return b.score - a.score
          }
        })
        .slice(0, 50) // Limit results for performance

      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [scoreMatch, findMatches])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
  }, [])

  return {
    searchNotes,
    clearSearch,
    searchResults,
    searchQuery,
    isSearching,
    highlightText
  }
}
