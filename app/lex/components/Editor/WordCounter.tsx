interface WordCounterProps {
  text: string
  isDarkMode: boolean
}

export function WordCounter({ text, isDarkMode }: WordCounterProps) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const chars = text.length
  
  return (
    <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
      {words} {words === 1 ? 'word' : 'words'} • {chars} {chars === 1 ? 'char' : 'chars'}
    </div>
  )
}