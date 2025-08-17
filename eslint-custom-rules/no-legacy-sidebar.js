module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent usage of legacy sidebar components',
      category: 'Architecture',
      recommended: true,
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        
        // Check for legacy sidebar imports
        if (source.includes('src/layouts/full/vertical/sidebar')) {
          context.report({
            node,
            message: 'Legacy sidebar imports are not allowed. Use EnhancedSidebar instead.',
          });
        }
      },

      JSXElement(node) {
        const elementName = node.openingElement.name;
        
        // Check for legacy Sidebar JSX elements
        if (elementName.type === 'JSXIdentifier') {
          const name = elementName.name;
          
          if (name === 'Sidebar' || name === 'VerticalSidebar' || name === 'AppSidebar') {
            // Allow only EnhancedSidebar
            if (name !== 'EnhancedSidebar') {
              context.report({
                node,
                message: `Legacy sidebar component <${name}> is not allowed. Use <EnhancedSidebar> instead.`,
              });
            }
          }
        }
      },
    };
  },
};