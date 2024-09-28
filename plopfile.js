export default function (plop) {
	plop.setGenerator('comp', {
		prompts: [
			{
				type: 'input',
				name: 'name',
				message: 'Component name:',
			},
		],
		actions: [
			{
				type: 'add',
				path: 'src/comps/{{pascalCase name}}/index.jsx',
				templateFile: 'templates/comp.jsx.hbs',
			},
			{
				type: 'add',
				path: 'src/comps/{{pascalCase name}}/index.module.scss',
				templateFile: 'templates/comp.scss.hbs',
			},
		],
	})

	plop.setGenerator('route', {
		prompts: [
			{
				type: 'input',
				name: 'name',
				message: 'Route name:',
			},
		],
		actions: [
			{
				type: 'add',
				path: 'src/routes/{{kebabCase name}}/index.jsx',
				templateFile: 'templates/route.jsx.hbs',
			},
			{
				type: 'add',
				path: 'src/routes/{{kebabCase name}}/index.module.scss',
				templateFile: 'templates/route.scss.hbs',
			},
		],
	})
}
