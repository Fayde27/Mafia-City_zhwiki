export default function WikiFooter() {
  return (
    <footer className="bg-wiki-darker border-t-2 border-wiki-accent mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-wiki-accent font-bold uppercase tracking-wider mb-4">
              黑道風雲 Wiki
            </h3>
            <p className="text-wiki-text-muted text-sm">
              最全面的游戏攻略站，为玩家提供详细的游戏资讯、角色图鉴、任务攻略等内容。
            </p>
          </div>
          <div>
            <h3 className="text-wiki-accent font-bold uppercase tracking-wider mb-4">
              快速链接
            </h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/wiki/characters" className="text-wiki-text-muted hover:text-wiki-accent">角色图鉴</a></li>
              <li><a href="/wiki/weapons" className="text-wiki-text-muted hover:text-wiki-accent">武器装备</a></li>
              <li><a href="/wiki/missions" className="text-wiki-text-muted hover:text-wiki-accent">任务攻略</a></li>
              <li><a href="/wiki/maps" className="text-wiki-text-muted hover:text-wiki-accent">地图探索</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-wiki-accent font-bold uppercase tracking-wider mb-4">
              管理入口
            </h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/admin/login" className="text-wiki-text-muted hover:text-wiki-accent">管理员登录</a></li>
              <li><a href="/admin" className="text-wiki-text-muted hover:text-wiki-accent">内容管理</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-wiki-border mt-8 pt-6 text-center text-wiki-text-muted text-sm">
          <p>&copy; {new Date().getFullYear()} 黑道風雲 Wiki. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
