module.exports = {
	root: true,
	env: { browser: true, es2020: true },
	plugins: ['import'],
	extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],
	ignorePatterns: ['dist', '*.cjs'],
	parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
	settings: {
		react: { version: '18.2' },
		'import/resolver': {
			node: {
				extensions: ['.js', '.jsx', '.json'],
			},
		},
	},
	rules: {
		'import/no-dynamic-require': 0,
		'import/no-extraneous-dependencies': [2, { devDependencies: true }],
		'import/no-named-as-default': 0,
		'import/no-unresolved': [
			2,
			{
				ignore: ['^~/'],
			},
		],
		'import/prefer-default-export': 0,
		'no-constant-condition': 0,
		'no-case-declarations': 0,
		'no-extra-boolean-cast': 0,
		'no-extra-semi': 0,
		'no-mixed-spaces-and-tabs': 0,
		'no-prototype-builtins': 0,
		'no-unused-vars': 1,
		'react-hooks/exhaustive-deps': 0,
		'react/prop-types': 1,
	},
}
