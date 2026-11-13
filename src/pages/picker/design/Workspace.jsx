import { C } from './tokens';
import { Inspector } from './ui';

// Ro'yxat + inspector ish maydoni (Navbat, Qaytgan, E'tiroz, Tarix).
//  vw ≥ 900  — inspector doimiy o'ng ustun (split)
//  640–899   — inspector o'ngdan chiquvchi drawer
//  < 640     — inspector to'liq ekran
export function workspaceMode(vw) {
  if (vw < 640) return 'mobile';
  if (vw < 900) return 'drawer';
  return 'split';
}

export function inspectorWidth(vw, mode) {
  if (mode === 'drawer') return 420;
  if (vw >= 1600) return 480;
  if (vw >= 1280) return 420;
  return 380;
}

// scrollAll — asboblar paneli ham ro'yxat bilan birga aylanadi (Tarix: sana + KPI baland)
export default function Workspace({ vw, bar, mobileTitle, toolbar, children, inspector, insOpen, onCloseIns, insLabel, insTopTitle, listLabel, scrollAll }) {
  const mode = workspaceMode(vw);
  const mobile = mode === 'mobile';
  const desk = vw >= 1280;
  const insW = inspectorWidth(vw, mode);
  const tools = (
    <div style={{ flex: 'none', padding: mobile ? '16px 16px 8px' : desk ? '16px 24px 8px' : '16px 20px 8px', display: 'flex', flexDirection: 'column', gap: 12, background: C.canvas }}>
      {mobile && mobileTitle}
      {toolbar}
    </div>
  );
  const listPad = mobile ? '4px 16px 24px' : desk ? '4px 24px 24px' : '4px 20px 20px';
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
      <section aria-label={listLabel} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {!mobile && bar}
        {scrollAll ? (
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {tools}
            <div style={{ padding: listPad }}>{children}</div>
          </div>
        ) : (
          <>
            {tools}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: listPad }}>{children}</div>
          </>
        )}
      </section>
      <Inspector mode={mode} open={insOpen} width={insW} onClose={onCloseIns} label={insLabel} topTitle={insTopTitle}>
        {inspector}
      </Inspector>
    </div>
  );
}
