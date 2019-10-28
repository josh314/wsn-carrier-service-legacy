module.exports = {
    "env": {
        "node": true,
        "es6": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "extends": [
        "eslint:recommended",
        // "plugin:@typescript-eslint/eslint-recommended",
        // "plugin:@typescript-eslint/recommended",
        // "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    "rules": {
        "array-callback-return": [
            "error",
            { "allowImplicit": true } 
        ],
        "block-scoped-var": "error",
        "default-case": "error",
        "indent": [
            "warn",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "no-console": "off",
        "no-caller": "error",
        "no-empty-function": "warn",
        "no-eq-null": "error",
        "no-template-curly-in-string": "warn",
        "no-undef": "off",
        "no-unused-vars": "warn",
        "no-unused-vars": [
          "warn",
          {
            "caughtErrors": "none",
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
          }
        ],
        // "quotes": [
        //     "warn",
        //     "single"
        // ],
        "semi": [
            "warn",
            "always"
        ]
    },
};