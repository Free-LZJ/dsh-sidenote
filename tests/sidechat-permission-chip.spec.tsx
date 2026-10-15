/**
 * PermissionChip 渲染回归：chip 必须读宿主 permissions 投影的 wire view
 * （`{ currentValue }`）——曾经的读法拿投影**内部 state** 的 {@code preset}，
 * 该字段在客户端恒为 undefined，于是档位永远显示默认的 workspace-write，
 * 点 Full access 后界面纹丝不动（dsh 0.2.0-rc.2 实证）。
 *
 * @vitest-environment jsdom
 */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import type { SessionFace } from '../src/client/host/contracts.ts'
import { PermissionChip } from '../src/client/sidechat/PermissionChip.tsx'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** 会话镜像：只带 permissions 投影面，快照引用稳定（useSyncExternalStore 要求）。 */
function sessionOf(currentValue: string | undefined): SessionFace {
  const value = currentValue === undefined ? undefined : { currentValue }
  const face = { subscribe: () => () => {}, getSnapshot: () => value }
  return { projections: { faceOf: () => face } } as unknown as SessionFace
}

function renderChip(session: SessionFace | undefined): string {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  act(() => { root.render(<PermissionChip session={session} />) })
  const text = host.textContent ?? ''
  act(() => { root.unmount() })
  host.remove()
  return text
}

describe('PermissionChip', () => {
  it('显示 wire view 的 currentValue（而不是投影内部 state 的 preset）', () => {
    expect(renderChip(sessionOf('danger-full-access'))).toContain('Full access')
    expect(renderChip(sessionOf('workspace-write'))).toContain('Workspace Write')
    expect(renderChip(sessionOf('custom'))).toContain('Custom')
  })

  it('投影面或快照缺席（老宿主）时不渲染', () => {
    expect(renderChip(undefined)).toBe('')
    expect(renderChip(sessionOf(undefined))).toBe('')
  })
})
