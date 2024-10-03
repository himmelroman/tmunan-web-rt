import store, { toggleProperty } from './redux'

// TODO: move into user space and make configurable
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

export const hotkeyHandler = e => {
	const action = bindingsMap.find(
		b => b.key === e.code && b.ctrlKey === e.ctrlKey && b.altKey === e.altKey && b.shiftKey === e.shiftKey
	)
	if (!action) return

	const callback = keyActions[action.name]
	if (callback) {
		e.preventDefault()
		callback()
	} else {
		console.log('No Key Action', action.name)
	}
}
