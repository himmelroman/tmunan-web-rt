/**
 *
 * Thunks
 *
 */

import socket from './socket'
import { loadCue } from './redux'

export const loadAndSendCue = index => (dispatch, getState) => {
	const state = getState()
	index = parseInt(index)
	const cue = state.app.cues[index]
	if (!cue) return
	dispatch(loadCue(index))
	socket.send('parameters', { ...cue, override: true })
}
