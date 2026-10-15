/**
 * 权限 chip（WI-02，D2 定档 c：同权 + 常显）：显示子会话当前权限档位，
 * 点击弹 Menu 切换（原生同路径：`session.command('/permission <id>')`）。
 *
 * 数据：session.projections.faceOf('permissions')（off-face——缺席则 chip
 * 不渲染）。快照 = 宿主的 wire view，只有一个 currentValue 字段
 * （dsh-permission-presets 的 wire.viewSchema = { currentValue }；权威见
 * 该包 lib/types 的 selectionSchema）——{preset, sandbox, approval} 是投影
 * **内部 state**（stateSchema），客户端拿不到，读它会让 chip 恒显示默认档。
 */
import { useMemo, useState, useSyncExternalStore } from 'react'
import { Menu, type MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives'
import { IconChevronDownOutline14, IconInspectOutline12 } from '../host/icons.ts'
import type { SessionFace } from '../host/contracts.ts'
import { t } from '../locales.ts'
import { useLocaleTick } from '../locale-tick.ts'
import css from './sidechat.module.css'

/** 宿主 permissions 投影的 wire view（selector 快照形状）。 */
interface PermissionSnapshot {
  currentValue?: string
}

/** preset 机器值 → 展示名（宿主 displayPermissionPreset 同款：Full access 特例）。 */
function presetLabel(preset: string): string {
  if (preset === 'danger-full-access') return t('permFullAccess')
  return preset
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** 宿主默认表里 chip 菜单列出的档位（其余档位仍可由 /permission 切换）。 */
const KNOWN_PRESETS = ['workspace-write', 'danger-full-access'] as const

export function PermissionChip(props: { session: SessionFace | undefined }) {
  useLocaleTick()
  const [open, setOpen] = useState(false)

  // off-face 探测：projections 面缺席（老宿主）→ chip 不渲染。
  const face = useMemo(() => {
    const p = props.session as unknown as { projections?: { faceOf?: (key: string) => { subscribe(f: () => void): () => void; getSnapshot(): unknown } } } | undefined
    return typeof p?.projections?.faceOf === 'function' ? p.projections.faceOf('permissions') : undefined
  }, [props.session])

  const snapshot = useSyncExternalStore(
    (fn) => face?.subscribe(fn) ?? (() => {}),
    () => (face?.getSnapshot() as PermissionSnapshot | undefined) ?? null,
  )

  // 快照缺席（老宿主没有该投影 key）→ chip 不渲染。
  if (face === undefined || snapshot === null) return null
  const effective = snapshot.currentValue ?? 'workspace-write'

  const items: MenuEntry[] = KNOWN_PRESETS.map(id => ({
    id,
    label: presetLabel(id) + (id === effective ? ' ✓' : ''),
  }))

  return (
    <Menu
      open={open}
      side="top"
      portal
      compact
      anchor={
        <button
          type="button"
          className={css.modelSelect}
          title={t('permChipTitle')}
          onClick={() => { setOpen(!open) }}
        >
          <IconInspectOutline12 size={12} />
          <span>{presetLabel(effective)}</span>
          <IconChevronDownOutline14 size={12} />
        </button>
      }
      items={items}
      onClose={() => { setOpen(false) }}
      onSelect={(id) => {
        setOpen(false)
        void props.session?.command(`/permission ${id}`).catch(() => {})
      }}
    />
  )
}
