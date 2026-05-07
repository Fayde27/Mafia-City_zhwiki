export default function WikiFooter() {
  return (
    <footer className="bg-wiki-dark border-t border-wiki-border/20 mt-8 md:mt-12">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div>
            <h3 className="text-wiki-accent font-bold uppercase tracking-wider mb-3 md:mb-4 text-sm md:text-base">
              黑道風雲 Wiki
            </h3>
            <p className="text-wiki-text-muted text-xs md:text-sm">
              最全面的游戏攻略站，为玩家提供详细的游戏资讯、角色图鉴、任务攻略等内容。
            </p>
          </div>
          <div>
            <h3 className="text-wiki-accent font-bold uppercase tracking-wider mb-3 md:mb-4 text-sm md:text-base">
              快速链接
            </h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li><a href="/wiki" className="text-wiki-text-muted hover:text-wiki-accent">图鉴</a></li>
              <li><a href="/wiki/guides" className="text-wiki-text-muted hover:text-wiki-accent">玩法攻略</a></li>
              <li><a href="/wiki/articles" className="text-wiki-text-muted hover:text-wiki-accent">游戏资讯</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-wiki-accent font-bold uppercase tracking-wider mb-3 md:mb-4 text-sm md:text-base">
              管理入口
            </h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li><a href="/admin/login" className="text-wiki-text-muted hover:text-wiki-accent">管理员登录</a></li>
              <li><a href="/admin/dashboard" className="text-wiki-text-muted hover:text-wiki-accent">内容管理</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-wiki-border/20 mt-6 md:mt-8 pt-4 md:pt-6 text-center text-wiki-text-muted text-xs md:text-sm">
          <p>&copy; {new Date().getFullYear()} 黑道風雲 Wiki. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
