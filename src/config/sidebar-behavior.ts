export const SIDEBAR_BEHAVIOR = {
  groupClick: 'toggle' as 'toggle' | 'navigateFirst',
  hoverOpenDelayMs: 120,
  hoverCloseDelayMs: 200,
  pinOnClickMs: 1500,
  tooltipDelayMs: 200,
  flyoutZIndex: 80,
  collapsed: {
    clickOpensFlyout: true,
    hoverOpensFlyout: true,
    pinOnClickMs: 1500
  }
} as const;