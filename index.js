function hasTypeOfOperator(node) {
  const { parent } = node;

  return parent.type === "UnaryExpression" && parent.operator === "typeof";
}

module.exports = {
  rules: {
    "no-undef": {
      meta: {
        docs: {
          description:
            "disallow the use of undeclared variables unless mentioned in `/*global */` comments or created using set(...)",
          category: "Variables",
          recommended: true,
          url:
            "https://github.com/negativetwelve/jest-plugins/tree/master/packages/jest-plugin-set"
        },

        schema: [
          {
            type: "object",
            properties: {
              typeof: {
                type: "boolean"
              }
            },
            additionalProperties: false
          }
        ]
      },

      create(context) {
        const [options] = context.options;
        const considerTypeOf = (options && options.typeof === true) || false;
        const safeGlobals = [];

        return {
          CallExpression(node) {
            if (node.callee.type === "Identifier") {
              const { name } = node.callee;

              if (name === "set" && node.arguments[0]) {
                safeGlobals.push(node.arguments[0].value);
              }
            }
          },

          "Program:exit": function ProgramExit(/* node */) {
            const globalScope = context.getScope();

            globalScope.through.forEach(ref => {
              const { identifier } = ref;

              if (
                (!considerTypeOf && hasTypeOfOperator(identifier)) ||
                safeGlobals.includes(identifier.name)
              ) {
                return;
              }

              context.report({
                node: identifier,
                message: "'{{name}}' is not defined.",
                data: identifier
              });
            });
          }
        };
      }
    }
  }
};
