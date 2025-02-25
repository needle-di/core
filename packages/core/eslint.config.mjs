import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  eslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    settings: {
      "import/resolver": {
        typescript: true,
      },
    },
    rules: {
      "quote-props": ["error", "consistent-as-needed"],
      "import/no-named-as-default-member": ["off"],
      "import/order": [
        "error",
        {
          "newlines-between": "always",
        },
      ],
      "import/extensions": ["error", "always"],
    },
  },
);
