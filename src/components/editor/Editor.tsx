import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Typography } from '@tiptap/extension-typography'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Link } from '@tiptap/extension-link'
import CharacterCount from '@tiptap/extension-character-count'
import Document from '@tiptap/extension-document'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { EditorToolbar } from './EditorToolbar'

interface EditorProps {
  content?: string
  onChange?: (content: string) => void
  onSave?: () => void
  editable?: boolean
  placeholder?: string
}

export function Editor({ 
  content = '', 
  onChange, 
  onSave,
  editable = true, 
  placeholder = 'Start writing your note...' 
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: false,
        hardBreak: false,
        paragraph: {
          HTMLAttributes: {
            class: 'min-w-[1px] my-1 leading-5'
          }
        }
      }),
      CharacterCount,
      Document,
      Typography,
      TaskList,
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start pl-1.5 gap-2 [&>div]:mb-0 [&>label]:mt-0 [&>div]:w-full [&>div>p]:inline-block [&>label]:inline-flex [&>label]:items-center [&>label>input]:rounded-md'
        },
        nested: true
      }),
      Link.configure({
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80 transition-all cursor-pointer text-base [&>*]:font-normal'
        }
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        considerAnyAsEmpty: true,
      }),
      Markdown.configure({
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true,
      })
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-theme mx-auto focus:outline-none min-h-full pb-6 select-text max-w-none',
        'data-placeholder': placeholder
      },
      handleKeyDown: (_, event) => {
        // Save on Cmd+S / Ctrl+S
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
          event.preventDefault()
          onSave?.()
          return true
        }
        return false
      }
    },
    onUpdate: ({ editor }) => {
      // Get markdown content instead of HTML
      const markdown = editor.storage.markdown.getMarkdown()
      onChange?.(markdown)
    }
  })

  return (
    <div className="w-full h-full">
      <EditorContent 
        editor={editor} 
        className="w-full h-full prose prose-theme prose-lg max-w-none focus:outline-none"
      />
      
      {/* Status bar with character/word count */}
      {editor && (
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded border">
          {editor.storage.characterCount.characters()} chars, {editor.storage.characterCount.words()} words
        </div>
      )}
    </div>
  )
}
