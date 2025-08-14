import { Edit3, MessageCircle, MessageSquare } from 'lucide-react'

interface SidebarProps {
  selection: any
  isDarkMode: boolean
}

export function Sidebar({ selection, isDarkMode }: SidebarProps) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-direction-column gap-2">
      <div className="flex flex-col gap-2">
        <button
          className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
            isDarkMode
              ? 'bg-[#242424] border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]'
              : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          } ${!selection ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!selection}
          title="Edit selected text"
        >
          <Edit3 className="h-4 w-4" />
          <span className="text-xs">Edit</span>
          <span className={`text-[10px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>⌘E</span>
        </button>
        
        <button
          className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
            isDarkMode
              ? 'bg-[#242424] border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]'
              : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title="Chat about document"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">Chat</span>
          <span className={`text-[10px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>⌘L</span>
        </button>
        
        <button
          className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
            isDarkMode
              ? 'bg-[#242424] border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]'
              : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title="Add comment"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">Comment</span>
          <span className={`text-[10px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>⌘M</span>
        </button>
      </div>
    </div>
  )
}