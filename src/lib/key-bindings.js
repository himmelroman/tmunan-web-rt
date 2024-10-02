import store, { toggleProperty } from './redux'

export const keyBindings = {
	show_source: '1',
	show_output: '2',
	show_ui: 'q',
	show_cuelist: 'w',
	fullscreen: 'f',
	new_project: 'ctrl+n',
	open_project: 'ctrl+o',
	save_project: 'ctrl+s',
	save_project_as: 'ctrl+shift+s',
}

export const bindingsMap = Object.entries(keyBindings).map(([name, key]) => {
	let modifiers = []
	let ctrlKey = false
	let altKey = false
	let shiftKey = false
	if (key.includes('+')) {
		modifiers = key.replace(/\s/gi, '').split('+')
		key = modifiers.pop()
		ctrlKey = modifiers.includes('Ctrl')
		altKey = modifiers.includes('Alt')
		shiftKey = modifiers.includes('Shift')
	}
	if (/[0-9]/.test(key)) key = `Digit${key}`
	else if (/^[A-Za-z]$/.test(key)) key = `Key${key.toUpperCase()}`
	else if (key === ' ') key = 'Space'
	else if (key === 'Enter') key = 'Enter'
	else throw new Error(`Invalid key: '${key}'`)

	return { name, key, ctrlKey, altKey, shiftKey }
})

export const keyActions = {
	show_cuelist: () => store.dispatch(toggleProperty('show_cuelist')),
	show_source: () => store.dispatch(toggleProperty('show_source')),
	show_output: () => store.dispatch(toggleProperty('show_output')),
	fullscreen: () => {
		document.fullscreenElement ? document.exitFullscreen() : document.querySelector('body').requestFullscreen()
	},
	new_project: () => {
		console.log('New Project')
	},
	show_ui: () => store.dispatch(toggleProperty('show_ui')),
}

export const triggerKey = e => {
	const action = bindingsMap.find(
		b => b.key === e.code && b.ctrlKey === e.ctrlKey && b.altKey === e.altKey && b.shiftKey === e.shiftKey
	)

	if (!action) {
		console.log('No Key Binding', e.code, e.ctrlKey, e.altKey, e.shiftKey)
		return
	}

	const callback = keyActions[action.name]
	if (callback) {
		console.log('Triggering Key', action.name)
		e.preventDefault()
		callback()
	} else {
		console.log('No Key Action', action.name)
	}
}

// console.log('Key Bindings', keyBindings)
// console.log('Key Bindings Map', bindingsMap)
