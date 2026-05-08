import { useRef, useState } from 'react'
import { db } from '../db/database'
import { transactionsToCSV, downloadCSV, parseTransactionsCSV } from '../utils/csv'
import { clearAllData, addTransaction, getAllTransactions } from '../db/queries'
import { Card, SectionHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [delConfirm, setDelConfirm] = useState(false)
  const { showToast, ToastContainer } = useToast()

  const handleExport = async () => {
    const rows = await getAllTransactions()
    if (rows.length === 0) { showToast('エクスポートするデータがありません', 'error'); return }
    const csv = transactionsToCSV(rows)
    const now = new Date()
    const fname = `zaimu-board-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.csv`
    downloadCSV(csv, fname)
    showToast(`${rows.length}件をエクスポートしました`)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseTransactionsCSV(text)
    if (parsed.length === 0) { showToast('インポートできるデータがありませんでした', 'error'); return }
    for (const row of parsed) await addTransaction(row)
    showToast(`${parsed.length}件をインポートしました`)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDeleteAll = async () => {
    if (!delConfirm) { setDelConfirm(true); return }
    await clearAllData()
    setDelConfirm(false)
    showToast('全データを削除しました')
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      <ToastContainer />
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <h1 className="text-lg font-bold text-brand-text">設定</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* CSVバックアップ */}
        <Card>
          <SectionHeader title="データのバックアップ" sub="CSVファイルで書き出し・読み込み" />
          <div className="space-y-3">
            <Button fullWidth variant="secondary" onClick={handleExport}>
              📤 CSVエクスポート
            </Button>
            <Button fullWidth variant="secondary" onClick={() => fileRef.current?.click()}>
              📥 CSVインポート
            </Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </div>
        </Card>

        {/* PWAヒント */}
        <Card>
          <SectionHeader title="ホーム画面に追加する方法" sub="オフラインで使えるようになります" />
          <ol className="space-y-2 text-sm text-brand-muted">
            <li className="flex gap-2"><span className="font-bold text-brand-blue flex-shrink-0">1.</span>Safari の共有ボタン（↑）をタップ</li>
            <li className="flex gap-2"><span className="font-bold text-brand-blue flex-shrink-0">2.</span>「ホーム画面に追加」を選択</li>
            <li className="flex gap-2"><span className="font-bold text-brand-blue flex-shrink-0">3.</span>「追加」をタップ</li>
            <li className="flex gap-2"><span className="font-bold text-brand-blue flex-shrink-0">4.</span>ホーム画面のアイコンから起動 ✅</li>
          </ol>
        </Card>

        {/* アプリ情報 */}
        <Card>
          <SectionHeader title="アプリ情報" />
          <div className="space-y-2 text-sm">
            {[
              ['アプリ名', 'Zaimu Board'],
              ['バージョン', '0.1.0'],
              ['データ保存', 'IndexedDB（端末内）'],
              ['ネット接続', '不要（完全オフライン）'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-brand-muted">{k}</span>
                <span className="font-medium text-brand-text">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* データ削除 */}
        <Card className="border-2 border-red-50">
          <SectionHeader title="データ管理" />
          {delConfirm ? (
            <div className="space-y-2">
              <p className="text-sm text-red-600 font-medium">⚠️ 全データを削除します。この操作は取り消せません。</p>
              <div className="flex gap-2">
                <Button variant="danger" fullWidth onClick={handleDeleteAll}>本当に削除する</Button>
                <Button variant="ghost" fullWidth onClick={() => setDelConfirm(false)}>キャンセル</Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" fullWidth onClick={handleDeleteAll}>
              🗑️ 全データを削除する
            </Button>
          )}
        </Card>
      </div>
    </div>
  )
}
