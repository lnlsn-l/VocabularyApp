export function DataNotice() {
  return <details className="data-notice">
    <summary>数据说明</summary>
    <p>你的词库保存在当前浏览器的 IndexedDB 中，不会自动上传到服务器。GitHub Pages 只提供网页，GitHub 仓库只保存程序代码。</p>
    <p>不同设备、浏览器或用户配置文件拥有独立词库，不会自动同步。共用同一浏览器配置文件的人也共用此词库。</p>
    <p>换设备、换浏览器或清除网站数据前，请先导出 JSON 备份。清理网站数据、删除浏览器配置文件或系统重装可能导致数据丢失，请定期备份。</p>
    <p>localhost 与在线网站属于不同 Origin，词库不会自动迁移。请在旧地址导出 JSON，再在新地址导入；新地址的空词库不代表旧数据被删除。同一 Origin 下不同路径通常共用站点存储。</p>
  </details>
}
