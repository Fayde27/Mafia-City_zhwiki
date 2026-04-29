interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let inList = false
    let listItems: React.ReactNode[] = []
    let inCodeBlock = false
    let codeLines: string[] = []
    let codeLanguage = ''

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 mb-4 text-wiki-text">
            {listItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )
        listItems = []
        inList = false
      }
    }

    const flushCodeBlock = () => {
      if (codeLines.length > 0) {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-wiki-darker border border-wiki-border p-4 rounded mb-4 overflow-x-auto">
            <code className="text-wiki-text font-mono text-sm">
              {codeLines.join('\n')}
            </code>
          </pre>
        )
        codeLines = []
        inCodeBlock = false
        codeLanguage = ''
      }
    }

    const processInline = (line: string): React.ReactNode => {
      const parts: React.ReactNode[] = []
      let remaining = line
      let keyIndex = 0

      while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
        const italicMatch = remaining.match(/\*(.+?)\*/)
        const codeMatch = remaining.match(/`(.+?)`/)
        const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/)

        const matches = [
          boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
          italicMatch ? { type: 'italic', match: italicMatch, index: italicMatch.index! } : null,
          codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index! } : null,
          linkMatch ? { type: 'link', match: linkMatch, index: linkMatch.index! } : null,
        ].filter(Boolean).sort((a, b) => a!.index - b!.index)

        if (matches.length === 0) {
          parts.push(<span key={keyIndex++}>{remaining}</span>)
          break
        }

        const firstMatch = matches[0]!

        if (firstMatch.index > 0) {
          parts.push(<span key={keyIndex++}>{remaining.slice(0, firstMatch.index)}</span>)
        }

        switch (firstMatch.type) {
          case 'bold':
            parts.push(<strong key={keyIndex++} className="text-wiki-accent font-bold">{firstMatch.match![1]}</strong>)
            remaining = remaining.slice(firstMatch.index + firstMatch.match![0].length)
            break
          case 'italic':
            parts.push(<em key={keyIndex++}>{firstMatch.match![1]}</em>)
            remaining = remaining.slice(firstMatch.index + firstMatch.match![0].length)
            break
          case 'code':
            parts.push(<code key={keyIndex++} className="bg-wiki-darker px-2 py-0.5 rounded text-wiki-accent font-mono text-sm">{firstMatch.match![1]}</code>)
            remaining = remaining.slice(firstMatch.index + firstMatch.match![0].length)
            break
          case 'link':
            parts.push(<a key={keyIndex++} href={firstMatch.match![2]} className="text-wiki-accent underline hover:text-wiki-accent-light">{firstMatch.match![1]}</a>)
            remaining = remaining.slice(firstMatch.index + firstMatch.match![0].length)
            break
        }
      }

      return parts.length === 1 ? parts[0] : <>{parts}</>
    }

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock()
        } else {
          flushList()
          inCodeBlock = true
          codeLanguage = line.slice(3)
        }
        return
      }

      if (inCodeBlock) {
        codeLines.push(line)
        return
      }

      if (line.startsWith('# ')) {
        flushList()
        elements.push(
          <h1 key={index} className="text-4xl font-heading font-bold text-wiki-accent mt-8 mb-6 heading-hard">{processInline(line.slice(2))}</h1>
        )
      } else if (line.startsWith('## ')) {
        flushList()
        elements.push(
          <h2 key={index} className="text-3xl font-heading font-bold text-wiki-accent mt-8 mb-4 heading-hard">{processInline(line.slice(3))}</h2>
        )
      } else if (line.startsWith('### ')) {
        flushList()
        elements.push(
          <h3 key={index} className="text-2xl font-bold text-wiki-text mt-6 mb-3">{processInline(line.slice(4))}</h3>
        )
      } else if (line.startsWith('#### ')) {
        flushList()
        elements.push(
          <h4 key={index} className="text-xl font-bold text-wiki-text mt-4 mb-2">{processInline(line.slice(5))}</h4>
        )
      } else if (line.startsWith('> ')) {
        flushList()
        elements.push(
          <blockquote key={index} className="border-l-4 border-wiki-accent pl-4 py-2 my-4 bg-wiki-gray/30 italic text-wiki-text-muted">
            {processInline(line.slice(2))}
          </blockquote>
        )
      } else if (line.startsWith('---') || line.startsWith('***')) {
        flushList()
        elements.push(<hr key={index} className="border-wiki-border my-6" />)
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        inList = true
        listItems.push(processInline(line.slice(2)))
      } else if (line.match(/^\d+\. /)) {
        flushList()
        const content = line.replace(/^\d+\. /, '')
        elements.push(
          <div key={index} className="flex items-start gap-2 mb-2">
            <span className="text-wiki-accent font-bold min-w-[24px]">{line.match(/^\d+/)?.[0]}.</span>
            <span>{processInline(content)}</span>
          </div>
        )
      } else if (line.startsWith('![')) {
        flushList()
        const match = line.match(/!\[(.+?)\]\((.+?)\)/)
        if (match) {
          elements.push(
            <img key={index} src={match[2]} alt={match[1]} className="max-w-full rounded my-4 border border-wiki-border" />
          )
        }
      } else if (line.startsWith('[')) {
        flushList()
        const match = line.match(/\[(.+?)\]\((.+?)\)/)
        if (match) {
          elements.push(
            <p key={index} className="mb-4">
              <a href={match[2]} className="text-wiki-accent underline hover:text-wiki-accent-light">{processInline(match[1])}</a>
            </p>
          )
        }
      } else if (line.trim() === '') {
        flushList()
        elements.push(<div key={index} className="h-4" />)
      } else {
        if (inList) {
          flushList()
        }
        elements.push(
          <p key={index} className="text-wiki-text mb-3 leading-relaxed">{processInline(line)}</p>
        )
      }
    })

    flushList()
    flushCodeBlock()

    return elements
  }

  return <div className="markdown-content">{renderMarkdown(content)}</div>
}
