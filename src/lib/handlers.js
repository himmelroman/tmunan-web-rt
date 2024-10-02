import store, { setLocalProp, setDiffusionParameter, setClientParameter, setTransform, setFilter } from './redux'
import socket from './socket'

export const onLocalChange = (value, name) => {
	store.dispatch(setLocalProp([name, value]))
}

export const onDiffusionParameterChange = (value, name) => {
	store.dispatch(setDiffusionParameter([name, value]))
	socket.debouncedSend('parameters', { diffusion: { [name]: value }, override: true })
}

export const onClientParameterChange = (value, name) => {
	store.dispatch(setClientParameter([name, value]))
	socket.debouncedSend('parameters', { client: { [name]: value }, override: true })
}

export const onTransformParameterChange = (value, name) => {
	store.dispatch(setTransform({ [name]: value }))
	socket.debouncedSend('parameters', { client: { transform: { [name]: value } }, override: true })
}

export const onFilterParameterChange = (value, name) => {
	store.dispatch(setFilter({ [name]: value }))
	socket.debouncedSend('parameters', { client: { filter: { [name]: value } }, override: true })
}

export const parameterCallbacks = {
	diffusion: onDiffusionParameterChange,
	filter: onFilterParameterChange,
	client: onClientParameterChange,
}
