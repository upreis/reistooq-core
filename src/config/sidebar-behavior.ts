export const SIDEBAR_BEHAVIOR = {
  // 'toggle' => click no pai expande/fecha; 'navigateFirst' => navega para o primeiro filho
  groupClick: 'toggle' as 'toggle' | 'navigateFirst',
  collapsed: {
    clickOpensFlyout: true,
    hoverOpensFlyout: true,
    pinOnClickMs: 1500 // mantém flyout aberto por 1.5s após clique no pai
  },
  tooltipDelayMs: 200
};