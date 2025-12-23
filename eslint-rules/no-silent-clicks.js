/**
 * ESLint rule to prevent silent clicks
 * 
 * This rule enforces that all clickable elements provide appropriate feedback.
 * It checks for buttons, links, and elements with click handlers to ensure
 * they have proper actions or explanations when disabled.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent silent clicks by ensuring all clickable elements provide feedback',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      silentButton: 'Button element must have onClick, href, or disabledReason when disabled',
      silentLink: 'Link element must have valid href or be properly disabled with explanation',
      silentClickHandler: 'Element with onClick must provide user feedback (navigation, modal, toast, etc.)',
      missingDisabledReason: 'Disabled interactive element must have disabledReason, title, or aria-label',
    },
  },

  create(context) {
    return {
      // Check JSX button elements
      'JSXElement[openingElement.name.name="button"]'(node) {
        const attributes = node.openingElement.attributes;
        const hasOnClick = attributes.some(attr => 
          attr.name && attr.name.name === 'onClick'
        );
        const hasHref = attributes.some(attr => 
          attr.name && attr.name.name === 'href'
        );
        const isDisabled = attributes.some(attr => 
          attr.name && attr.name.name === 'disabled'
        );
        const hasDisabledReason = attributes.some(attr => 
          attr.name && (
            attr.name.name === 'disabledReason' ||
            attr.name.name === 'title' ||
            attr.name.name === 'aria-label'
          )
        );

        if (isDisabled && !hasDisabledReason) {
          context.report({
            node,
            messageId: 'missingDisabledReason',
          });
        } else if (!isDisabled && !hasOnClick && !hasHref) {
          context.report({
            node,
            messageId: 'silentButton',
          });
        }
      },

      // Check JSX link elements
      'JSXElement[openingElement.name.name="a"]'(node) {
        const attributes = node.openingElement.attributes;
        const hasHref = attributes.some(attr => 
          attr.name && attr.name.name === 'href'
        );
        const hasOnClick = attributes.some(attr => 
          attr.name && attr.name.name === 'onClick'
        );
        const isDisabled = attributes.some(attr => 
          attr.name && (
            attr.name.name === 'disabled' ||
            (attr.name.name === 'aria-disabled' && 
             attr.value && attr.value.value === 'true')
          )
        );
        const hasDisabledReason = attributes.some(attr => 
          attr.name && (
            attr.name.name === 'title' ||
            attr.name.name === 'aria-label'
          )
        );

        if (isDisabled && !hasDisabledReason) {
          context.report({
            node,
            messageId: 'missingDisabledReason',
          });
        } else if (!isDisabled && !hasHref && !hasOnClick) {
          context.report({
            node,
            messageId: 'silentLink',
          });
        }
      },

      // Check elements with onClick handlers
      'JSXAttribute[name.name="onClick"]'(node) {
        const parent = node.parent;
        if (parent && parent.type === 'JSXOpeningElement') {
          const elementName = parent.name.name;
          
          // Skip if it's a button or link (handled above)
          if (elementName === 'button' || elementName === 'a') {
            return;
          }

          // Check if element has role="button" or similar interactive role
          const hasInteractiveRole = parent.attributes.some(attr => 
            attr.name && attr.name.name === 'role' &&
            attr.value && ['button', 'menuitem', 'tab'].includes(attr.value.value)
          );

          if (hasInteractiveRole) {
            // This is an interactive element, should follow button rules
            const isDisabled = parent.attributes.some(attr => 
              attr.name && (
                attr.name.name === 'disabled' ||
                (attr.name.name === 'aria-disabled' && 
                 attr.value && attr.value.value === 'true')
              )
            );
            const hasDisabledReason = parent.attributes.some(attr => 
              attr.name && (
                attr.name.name === 'title' ||
                attr.name.name === 'aria-label'
              )
            );

            if (isDisabled && !hasDisabledReason) {
              context.report({
                node: parent,
                messageId: 'missingDisabledReason',
              });
            }
          }
        }
      },

      // Check Button component usage (custom component)
      'JSXElement[openingElement.name.name="Button"]'(node) {
        const attributes = node.openingElement.attributes;
        const hasOnClick = attributes.some(attr => 
          attr.name && attr.name.name === 'onClick'
        );
        const hasHref = attributes.some(attr => 
          attr.name && attr.name.name === 'href'
        );
        const hasAsChild = attributes.some(attr => 
          attr.name && attr.name.name === 'asChild'
        );
        const isDisabled = attributes.some(attr => 
          attr.name && attr.name.name === 'disabled'
        );
        const hasDisabledReason = attributes.some(attr => 
          attr.name && attr.name.name === 'disabledReason'
        );

        // Skip validation if asChild is used (delegated to child element)
        if (hasAsChild) {
          return;
        }

        if (isDisabled && !hasDisabledReason) {
          context.report({
            node,
            messageId: 'missingDisabledReason',
          });
        } else if (!isDisabled && !hasOnClick && !hasHref) {
          context.report({
            node,
            messageId: 'silentButton',
          });
        }
      },
    };
  },
};