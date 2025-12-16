/**
 * 🔍 STICKY AUDIT OVERLAY
 * Diagnóstico visual completo para sticky header (sem console)
 * Aparece APENAS quando URL contém ?debugSticky=1
 */

import { useEffect, useState, useCallback } from 'react';

interface AncestorInfo {
  tag: string;
  classes: string;
  overflowX: string;
  overflowY: string;
  position: string;
  transform: string;
  filter: string;
  backdropFilter: string;
  contain: string;
  willChange: string;
  isSuspect: boolean;
  suspectReason: string;
}

interface ThInfo {
  position: string;
  top: string;
  zIndex: string;
  backgroundColor: string;
}

interface AuditData {
  buildId: string;
  pathname: string;
  search: string;
  scrollTarget: string;
  thInfo: ThInfo | null;
  ancestors: AncestorInfo[];
  firstBlocker: string | null;
}

const BUILD_ID = '2025-12-16-01';

function getScrollTarget(): string {
  // Detectar qual elemento está scrollando verticalmente
  const docEl = document.documentElement;
  const body = document.body;
  
  // Verificar se há algum container com scroll
  const allElements = document.querySelectorAll('*');
  for (const el of allElements) {
    if (el === docEl || el === body) continue;
    const style = getComputedStyle(el);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      if (el.scrollHeight > el.clientHeight) {
        const tag = el.tagName.toLowerCase();
        const classes = el.className ? `.${el.className.toString().split(' ').slice(0, 2).join('.')}` : '';
        return `CONTAINER: ${tag}${classes}`;
      }
    }
  }
  
  // Se nenhum container, é o body/document
  if (docEl.scrollHeight > docEl.clientHeight || body.scrollHeight > body.clientHeight) {
    return 'BODY/DOCUMENT (correto para sticky)';
  }
  
  return 'Nenhum scroll detectado';
}

function isSuspectStyle(style: CSSStyleDeclaration, el: Element): { suspect: boolean; reason: string } {
  const reasons: string[] = [];
  
  // Overflow check
  if (['auto', 'scroll', 'hidden'].includes(style.overflowY)) {
    reasons.push(`overflowY: ${style.overflowY}`);
  }
  
  // Transform check
  if (style.transform !== 'none') {
    reasons.push(`transform: ${style.transform.slice(0, 30)}`);
  }
  
  // Contain check
  if (style.contain && (style.contain.includes('paint') || style.contain.includes('layout'))) {
    reasons.push(`contain: ${style.contain}`);
  }
  
  // Filter check
  if (style.filter !== 'none') {
    reasons.push(`filter: ${style.filter}`);
  }
  
  // Backdrop filter check
  if (style.backdropFilter && style.backdropFilter !== 'none') {
    reasons.push(`backdropFilter: ${style.backdropFilter}`);
  }
  
  // Shadcn table wrapper check
  if (el.hasAttribute('data-shadcn-table-wrapper')) {
    if (style.overflowX === 'auto' || style.overflowY === 'auto') {
      reasons.push('SHADCN TABLE WRAPPER com overflow');
    }
  }
  
  return {
    suspect: reasons.length > 0,
    reason: reasons.join(', ')
  };
}

function getAncestors(th: Element): AncestorInfo[] {
  const ancestors: AncestorInfo[] = [];
  let current = th.parentElement;
  let count = 0;
  
  while (current && current !== document.body && count < 10) {
    const style = getComputedStyle(current);
    const { suspect, reason } = isSuspectStyle(style, current);
    
    ancestors.push({
      tag: current.tagName.toLowerCase(),
      classes: current.className ? current.className.toString().split(' ').slice(0, 3).join(' ') : '(none)',
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      position: style.position,
      transform: style.transform === 'none' ? 'none' : style.transform.slice(0, 25) + '...',
      filter: style.filter,
      backdropFilter: style.backdropFilter || 'none',
      contain: style.contain || 'none',
      willChange: style.willChange || 'auto',
      isSuspect: suspect,
      suspectReason: reason
    });
    
    current = current.parentElement;
    count++;
  }
  
  return ancestors;
}

function findFirstBlocker(ancestors: AncestorInfo[]): string | null {
  for (const anc of ancestors) {
    if (anc.isSuspect) {
      return `${anc.tag}.${anc.classes.split(' ')[0]} → ${anc.suspectReason}`;
    }
  }
  return null;
}

export function StickyAuditOverlay() {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);

  const runAudit = useCallback(() => {
    const th = document.querySelector('th');
    if (!th) {
      setAuditData({
        buildId: BUILD_ID,
        pathname: window.location.pathname,
        search: window.location.search,
        scrollTarget: getScrollTarget(),
        thInfo: null,
        ancestors: [],
        firstBlocker: 'Nenhum <th> encontrado na página'
      });
      return;
    }

    const thStyle = getComputedStyle(th);
    const ancestors = getAncestors(th);

    setAuditData({
      buildId: BUILD_ID,
      pathname: window.location.pathname,
      search: window.location.search,
      scrollTarget: getScrollTarget(),
      thInfo: {
        position: thStyle.position,
        top: thStyle.top,
        zIndex: thStyle.zIndex,
        backgroundColor: thStyle.backgroundColor
      },
      ancestors,
      firstBlocker: findFirstBlocker(ancestors)
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const debugMode = params.get('debugSticky') === '1';
    setIsDebugMode(debugMode);

    if (debugMode) {
      // Aplicar outlines visuais
      const applyDebugStyles = () => {
        document.querySelectorAll('thead').forEach(thead => {
          (thead as HTMLElement).style.outline = '3px solid red';
          (thead as HTMLElement).style.outlineOffset = '-1px';
        });
        document.querySelectorAll('th').forEach(th => {
          (th as HTMLElement).style.outline = '2px solid blue';
          (th as HTMLElement).style.outlineOffset = '-1px';
        });
      };

      // Executar auditoria inicial
      runAudit();
      applyDebugStyles();

      // Atualizar a cada 500ms
      const interval = setInterval(() => {
        runAudit();
        applyDebugStyles();
      }, 500);

      return () => {
        clearInterval(interval);
        // Limpar outlines ao sair do modo debug
        document.querySelectorAll('thead').forEach(thead => {
          (thead as HTMLElement).style.outline = '';
          (thead as HTMLElement).style.outlineOffset = '';
        });
        document.querySelectorAll('th').forEach(th => {
          (th as HTMLElement).style.outline = '';
          (th as HTMLElement).style.outlineOffset = '';
        });
      };
    }
  }, [runAudit]);

  if (!isDebugMode || !auditData) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-[9999] bg-gray-900 text-gray-100 p-4 rounded-lg shadow-2xl text-xs font-mono max-w-md max-h-[80vh] overflow-auto border-2 border-yellow-500"
      style={{ fontSize: '11px', lineHeight: '1.4' }}
    >
      {/* Header */}
      <div className="text-yellow-400 font-bold text-sm mb-2 border-b border-gray-700 pb-2">
        🔍 StickyAudit ON — build: {auditData.buildId}
      </div>

      {/* URL */}
      <div className="mb-2">
        <span className="text-gray-400">URL:</span> {auditData.pathname}{auditData.search}
      </div>

      {/* Scroll Target */}
      <div className="mb-2">
        <span className="text-gray-400">Scroll Target:</span>{' '}
        <span className={auditData.scrollTarget.includes('BODY') ? 'text-green-400' : 'text-red-400'}>
          {auditData.scrollTarget}
        </span>
      </div>

      {/* TH Info */}
      <div className="mb-2 p-2 bg-gray-800 rounded">
        <div className="text-blue-400 font-bold mb-1">{'<th>'} ComputedStyle:</div>
        {auditData.thInfo ? (
          <>
            <div>position: <span className={auditData.thInfo.position === 'sticky' ? 'text-green-400' : 'text-red-400'}>{auditData.thInfo.position}</span></div>
            <div>top: {auditData.thInfo.top}</div>
            <div>zIndex: {auditData.thInfo.zIndex}</div>
            <div>bgColor: {auditData.thInfo.backgroundColor}</div>
          </>
        ) : (
          <div className="text-red-400">Nenhum {'<th>'} encontrado</div>
        )}
      </div>

      {/* First Blocker */}
      <div className="mb-2 p-2 bg-gray-800 rounded">
        <span className="text-gray-400">BLOCKER DETECTADO:</span>{' '}
        {auditData.firstBlocker ? (
          <span className="text-red-400 font-bold">{auditData.firstBlocker}</span>
        ) : (
          <span className="text-green-400">Nenhum bloqueador detectado ✓</span>
        )}
      </div>

      {/* Ancestors */}
      <div className="mt-3">
        <div className="text-purple-400 font-bold mb-1">Ancestrais (até body):</div>
        <div className="space-y-1">
          {auditData.ancestors.map((anc, i) => (
            <div 
              key={i} 
              className={`p-1 rounded ${anc.isSuspect ? 'bg-red-900/50 border border-red-500' : 'bg-gray-800'}`}
            >
              <div className={anc.isSuspect ? 'text-yellow-400 font-bold' : 'text-gray-300'}>
                {i + 1}. {'<'}{anc.tag}{'>'} .{anc.classes.split(' ')[0]}
              </div>
              <div className="pl-2 text-gray-500">
                overflow: {anc.overflowX}/{anc.overflowY} | pos: {anc.position}
              </div>
              <div className="pl-2 text-gray-500">
                transform: {anc.transform} | contain: {anc.contain}
              </div>
              {anc.isSuspect && (
                <div className="pl-2 text-yellow-400 text-xs">
                  ⚠️ {anc.suspectReason}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t border-gray-700 text-gray-500">
        <div>🔴 outline vermelho = {'<thead>'}</div>
        <div>🔵 outline azul = {'<th>'}</div>
      </div>
    </div>
  );
}
