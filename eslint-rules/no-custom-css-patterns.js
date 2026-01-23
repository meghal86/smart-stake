/**
 * ESLint rule to prevent custom CSS patterns that bypass shared component library
 * This enforces the use of approved design tokens and shared components
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent custom CSS patterns that bypass shared component library',
      category: 'Design System Compliance',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowedPatterns: {
            type: 'array',
            items: { type: 'string' },
            default: []
          },
          bannedPatterns: {
            type: 'array',
            items: { type: 'string' },
            default: [
              'style={{',
              'className="[^"]*\\s+[^"]*"', // Multiple classes without proper spacing
              'bg-\\[#[0-9a-fA-F]{6}\\]', // Custom hex colors
              'text-\\[#[0-9a-fA-F]{6}\\]', // Custom hex text colors
              'w-\\[[0-9]+px\\]', // Custom pixel widths
              'h-\\[[0-9]+px\\]', // Custom pixel heights
              'p-\\[[0-9]+px\\]', // Custom pixel padding
              'm-\\[[0-9]+px\\]', // Custom pixel margins
            ]
          }
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedPatterns = options.allowedPatterns || [];
    const bannedPatterns = options.bannedPatterns || [
      'style={{',
      'bg-\\[#[0-9a-fA-F]{6}\\]',
      'text-\\[#[0-9a-fA-F]{6}\\]',
      'w-\\[[0-9]+px\\]',
      'h-\\[[0-9]+px\\]',
      'p-\\[[0-9]+px\\]',
      'm-\\[[0-9]+px\\]',
    ];

    function checkForBannedPatterns(node, value) {
      for (const pattern of bannedPatterns) {
        const regex = new RegExp(pattern);
        if (regex.test(value)) {
          // Check if it's in allowed patterns
          const isAllowed = allowedPatterns.some(allowedPattern => {
            const allowedRegex = new RegExp(allowedPattern);
            return allowedRegex.test(value);
          });

          if (!isAllowed) {
            context.report({
              node,
              message: `Avoid custom CSS pattern "${pattern}". Use approved design tokens and shared components instead.`,
            });
          }
        }
      }
    }

    return {
      // Check JSX attributes for inline styles
      JSXAttribute(node) {
        if (node.name && node.name.name === 'style' && node.value) {
          context.report({
            node,
            message: 'Avoid inline styles. Use Tailwind CSS classes or shared components instead.',
          });
        }

        if (node.name && node.name.name === 'className' && node.value) {
          let classValue = '';
          
          if (node.value.type === 'Literal') {
            classValue = node.value.value;
          } else if (node.value.type === 'JSXExpressionContainer' && 
                     node.value.expression.type === 'TemplateLiteral') {
            // Handle template literals in className
            classValue = node.value.expression.quasis.map(q => q.value.raw).join('${...}');
          }

          if (classValue) {
            checkForBannedPatterns(node, classValue);
          }
        }
      },

      // Check template literals that might contain CSS classes
      TemplateLiteral(node) {
        const source = context.getSourceCode();
        const text = source.getText(node);
        
        // Check if this template literal is likely used for CSS classes
        if (text.includes('bg-') || text.includes('text-') || text.includes('p-') || text.includes('m-')) {
          checkForBannedPatterns(node, text);
        }
      },

      // Check string literals that might be CSS classes
      Literal(node) {
        if (typeof node.value === 'string') {
          const parent = node.parent;
          
          // Check if this is likely a className value
          if (parent && parent.type === 'JSXAttribute' && 
              parent.name && parent.name.name === 'className') {
            checkForBannedPatterns(node, node.value);
          }
        }
      },
    };
  },
};

export default rule;