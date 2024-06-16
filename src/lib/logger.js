import store from './redux'

export function log(...args) {
	window.con.log(...args)
	store.dispatch({ type: 'app/logLine', payload: args.join(' ') })
}

export function warn(...args) {
	window.con.warn(...args)
	store.dispatch({ type: 'app/warnLine', payload: args.join(' ') })
}

export function error(...args) {
	window.con.error(...args)
	store.dispatch({ type: 'app/errorLine', payload: args.join(' ') })
}

export default { log, error }
