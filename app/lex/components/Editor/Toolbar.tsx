import { 
  Bold, Italic, Underline, Strikethrough, 
  Link, Quote, List, ListOrdered,
  Code, Heading1, AlignLeft, 
  AlignCenter, AlignRight, MoreHorizontal
} from 'lucide-react'

interface ToolbarProps {
  isDarkMode: boolean
}

export function Toolbar({ isDarkMode }: ToolbarProps) {
  const tools = [
    { icon: Heading1, command: 'formatBlock', value: 'H1', label: 'H1' },
    { divider: true },
    { icon: Bold, command: 'bold', label: 'B' },
    { icon: Italic, command: 'italic', label: 'I' },
    { icon: Underline, command: 'underline', label: 'U' },
    { icon: Strikethrough, command: 'strikethrough', label: 'S' },
    { divider: true },
    { icon: Link, command: 'createLink', label: '🔗' },
    { icon: Quote, command: 'formatBlock', value: 'BLOCKQUOTE', label: '""' },
    { icon: Code, command: 'formatBlock', value: 'CODE', label: '</>' },
    { divider: true },
    { icon: List, command: 'insertUnorderedList', label: '☰' },
    { icon: ListOrdered, command: 'insertOrderedList', label: '≡' },
    { divider: true },
    { icon: AlignLeft, command: 'justifyLeft', label: '⬅' },
    { icon: AlignCenter, command: 'justifyCenter', label: '↔' },
    { icon: AlignRight, command: 'justifyRight', label: '➡' },
    { divider: true },
    { icon: MoreHorizontal, command: 'more', label: '⋯' }
  ]
  
  const executeCommand = (command: string, value?: string) => {
    if (command === 'createLink') {
      const url = prompt('Enter URL:')
      if (url) document.execCommand(command, false, url)
    } else {
      document.execCommand(command, false, value)
    }
  }
  
  return (
    <div className={`flex items-center gap-1 mb-8 p-1 rounded-lg border transition-colors ${
      isDarkMode 
        ? 'bg-[#242424] border-gray-800' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      {tools.map((tool, index) => {
        if (tool.divider) {
          return (
            <div 
              key={index} 
              className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} 
            />
          )
        }
        
        const Icon = tool.icon
        if (!Icon) return null
        return (
          <button
            key={index}
            onClick={() => executeCommand(tool.command!, tool.value)}
            className={`p-2 rounded transition-colors ${
              isDarkMode 
                ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-300' 
                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
            title={tool.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}