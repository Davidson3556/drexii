export function useMarkdown() {
  function stripToolCalls(text: string): string {
    return text.replace(/\[TOOL_CALL:\s*\w+\([\s\S]*?\)\]\s*/g, '').trim()
  }

  function renderMarkdown(text: string): string {
    let html = stripToolCalls(text)

    html = html.replace(/^---$/gm, '<hr class="my-3 border-white/10">')

    html = html.replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-white/90 mt-3 mb-1">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-sm font-semibold text-white/90 mt-3 mb-1">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-base font-bold text-white mt-3 mb-1">$1</h1>')

    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, _lang, code) => {
      return `<pre class="bg-white/5 rounded-lg p-3 my-2 overflow-x-auto"><code class="text-xs text-emerald-300/80">${escapeHtml(code.trim())}</code></pre>`
    })

    html = html.replace(/`([^`]+)`/g, '<code class="bg-white/8 text-amber-300/80 px-1.5 py-0.5 rounded text-xs">$1</code>')

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/90 font-semibold">$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors">$1</a>')

    const lines = html.split('\n')
    const processed: string[] = []
    let listType: 'ul' | 'ol' | null = null

    for (const line of lines) {
      const bulletMatch = line.match(/^[\s]*[-*]\s+(.+)/)
      const numberedMatch = line.match(/^[\s]*(\d+)\.\s+(.+)/)

      if (bulletMatch) {
        if (listType !== 'ul') {
          if (listType === 'ol') processed.push('</ol>')
          processed.push('<ul class="space-y-1 my-2 ml-4">')
          listType = 'ul'
        }
        processed.push(`<li class="flex items-start gap-2"><span class="text-amber-400/60 mt-0.5 shrink-0">•</span><span>${bulletMatch[1]}</span></li>`)
      } else if (numberedMatch) {
        if (listType !== 'ol') {
          if (listType === 'ul') processed.push('</ul>')
          processed.push('<ol class="space-y-1 my-2 ml-4">')
          listType = 'ol'
        }
        processed.push(`<li class="flex items-start gap-2"><span class="text-amber-400/60 font-medium shrink-0">${numberedMatch[1]}.</span><span>${numberedMatch[2]}</span></li>`)
      } else {
        if (listType) {
          processed.push(listType === 'ul' ? '</ul>' : '</ol>')
          listType = null
        }
        if (line.trim() === '') {
          processed.push('<div class="h-2"></div>')
        } else {
          processed.push(line)
        }
      }
    }

    if (listType) {
      processed.push(listType === 'ul' ? '</ul>' : '</ol>')
    }

    return processed.join('\n')
  }

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  return { renderMarkdown, stripToolCalls }
}
