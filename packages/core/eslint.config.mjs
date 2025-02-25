import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // prettier-ignore
  eslint.configs.recommended,
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
    },
  },
);
