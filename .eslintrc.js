module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "extends": [ "eslint:recommended" ],
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
        "no-unused-vars": "off",
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