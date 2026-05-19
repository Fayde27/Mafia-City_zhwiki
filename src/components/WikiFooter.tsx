import Link from 'next/link'

const quickLinks = [
  { label: '首頁', href: '/' },
  { label: '遊戲圖鑑', href: '/wiki' },
  { label: '排行榜', href: '/wiki/rankings' },
  { label: '玩法攻略', href: '/wiki/guides' },
  { label: '活動一覽', href: '/wiki/events' },
  { label: '遊戲工具', href: '/wiki/tools' },
]

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.065-.022.134-.032.2-.032.211 0 .391.09.51.25l2.444 3.317V8.108c0-.345.282-.63.63-.63.345 0 .627.285.627.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  )
}

function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c-.276-.94-.418-1.92-.418-2.91 0-3.667 3.377-6.637 7.542-6.637.268 0 .53.017.79.04C15.912 4.246 12.567 2.188 8.69 2.188zm-2.48 3.532a.96.96 0 1 1 0 1.92.96.96 0 0 1 0-1.92zm4.88 0a.96.96 0 1 1 0 1.92.96.96 0 0 1 0-1.92zM24 15.24c0-3.39-3.376-6.145-7.542-6.145-4.163 0-7.54 2.755-7.54 6.145 0 3.392 3.377 6.148 7.54 6.148.871 0 1.71-.126 2.493-.36a.764.764 0 0 1 .626.087l1.672.979a.286.286 0 0 0 .147.047.257.257 0 0 0 .255-.258c0-.063-.026-.122-.042-.187l-.342-1.299a.517.517 0 0 1 .185-.582C23.076 18.893 24 17.144 24 15.24zm-9.95-1.38a.843.843 0 1 1 0-1.685.843.843 0 0 1 0 1.685zm4.82 0a.843.843 0 1 1 0-1.685.843.843 0 0 1 0 1.685z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export default function WikiFooter() {
  return (
    <footer className="bg-wiki-dark border-t border-wiki-border/20 mt-8 md:mt-12">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* 品牌簡介 */}
          <div>
            <h3 className="text-wiki-accent font-bold uppercase tracking-wider mb-3 md:mb-4 text-sm md:text-base">
              黑道風雲 Wiki
            </h3>
            <p className="text-wiki-text-muted text-xs md:text-sm">
              最全面的遊戲攻略站，為玩家提供詳細的遊戲資訊、角色圖鑑、任務攻略等內容。
            </p>
          </div>

          {/* 快速連結 */}
          <div>
            <h3 className="text-wiki-accent font-bold uppercase tracking-wider mb-3 md:mb-4 text-sm md:text-base">
              快速連結
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 md:gap-y-2 text-xs md:text-sm">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-wiki-text-muted hover:text-wiki-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 聯繫我們 */}
          <div>
            <h3 className="text-wiki-accent font-bold uppercase tracking-wider mb-3 md:mb-4 text-sm md:text-base">
              聯繫我們
            </h3>
            <ul className="space-y-3 text-xs md:text-sm">
              <li>
                <a
                  href="https://line.me/ti/p/@mafiaofgame"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-wiki-text-muted hover:text-[#06C755] transition-colors"
                >
                  <span className="text-[#06C755]"><LineIcon /></span>
                  <span>LINE：@mafiaofgame</span>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2.5 text-wiki-text-muted">
                  <span className="text-[#07C160]"><WeChatIcon /></span>
                  <span>WeChat：mafiaofvip</span>
                </div>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/playmafia.tw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-wiki-text-muted hover:text-[#1877F2] transition-colors"
                >
                  <span className="text-[#1877F2]"><FacebookIcon /></span>
                  <span>Facebook：黑道風雲</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部版權 */}
        <div className="border-t border-wiki-border/20 mt-6 md:mt-8 pt-4 md:pt-6 text-center">
          <p className="text-wiki-text-muted text-xs">
            &copy; {new Date().getFullYear()} 黑道風雲 Wiki 攻略站
          </p>
        </div>
      </div>
    </footer>
  )
}
