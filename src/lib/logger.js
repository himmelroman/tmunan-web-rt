import { Logtail } from '@logtail/browser'
import { NAME } from './constants'

const logger = new Logtail(import.meta.env.VITE_LOG_TOKEN)

logger.use(log => ({
	...log,
	name: NAME,
}))

// export default logger

export const debug = (...args) => {
	console.debug(...args)
	logger.debug(...args)
}

export const info = (...args) => {
	console.log(...args)
	logger.info(...args)
}

export const warn = (...args) => {
	console.warn(...args)
	logger.warn(...args)
}

export const error = (...args) => {
	console.error(...args)
	logger.error(...args)
}

export default {
	debug,
	info,
	warn,
	error,
}
