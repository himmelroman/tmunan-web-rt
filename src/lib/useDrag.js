import { useCallback, useEffect, useReducer, useRef } from 'react'
import { produce } from 'immer'

const initialDragState = {
	isDragging: false,
	items: null,
	dragId: null,
	dropId: null,
	after: false,
	startX: 0,
	startY: 0,
	minY: 0,
	maxY: 0,
}

const dragReducer = produce((s, a) => {
	switch (a.type) {
		case 'DRAG_START':
			s.isDragging = true
			Object.assign(s, a)
			break
		case 'DRAG_MOVE':
			s.after = a.after
			s.dropId = a.dropId
			break
		case 'DRAG_END':
			Object.assign(s, initialDragState)
			break
		default:
			break
	}
})

const useDrag = ({ targetSelector, itemSelector, ignoreSelector, onChange }) => {
	const dragElement = useRef()
	const dragBorder = useRef()
	const listenerRef = useRef({})
	const timeRef = useRef()

	const [state, dispatch] = useReducer(dragReducer, initialDragState)

	const { dragId, dropId, after } = state

	const cancelDrag = () => {
		if (timeRef.current) {
			clearTimeout(timeRef.current)
			timeRef.current = null
		}
		document.removeEventListener('mouseup', cancelDrag)
	}

	const onMouseDown = e => {
		document.addEventListener('mouseup', cancelDrag)
		if (timeRef.current) clearTimeout(timeRef.current)
		const ox = window.mx
		const oy = window.my
		timeRef.current = setTimeout(() => {
			if (ox !== window.mx || oy !== window.my) return
			if (state.isDragging) return

			const target = e.target.closest(targetSelector)
			if (!target) return
			document.getSelection().empty()
			const rect = target.getBoundingClientRect()
			const startX = e.clientX - rect.left
			const startY = e.clientY - rect.top

			const items = Array.from(document.querySelectorAll(itemSelector)).map(el => {
				const { idx, index, parent, first, last } = el.dataset
				const rect = el.getBoundingClientRect()
				const o = { id: el.id, index, rect, parent, idx, ignore: el.matches(ignoreSelector) }
				if (first) o.first = true
				if (last) o.last = true
				return o
			})
			items.sort((a, b) => a.rect.top - b.rect.top)

			const minY = items[0].rect.top - 10
			const maxY = items[items.length - 1].rect.bottom + 10

			const el = document.createElement('div')
			el.id = 'dragElement'
			el.setAttribute(
				'style',
				`position: absolute;
				zIndex: 1000;
				background-color: #b6f2;
				border: 1px solid #4001;
				pointerEvents: none;
				top: ${rect.top}px;
				left: ${rect.left - 1}px;
				width: ${rect.width}px;
				height: ${rect.height - 1}px;
				`
			)

			document.body.appendChild(el)
			dragElement.current = el

			const border = document.createElement('div')
			border.id = 'dragBorder'
			border.setAttribute(
				'style',
				`position: absolute;
				top: -200px;
				left: ${rect.left}px;
				width: ${rect.width}px;
				height: 1px;
				background-color: #2357;
				pointerEvents: none;`
			)

			border.innerHTML = `<div style="position: absolute; top: -5px; left: 0; width: 100%; height: 10px; background-color: #2371;"></div>`

			document.body.appendChild(border)
			dragBorder.current = border

			dispatch({ type: 'DRAG_START', dragId: target.id, items, startX, startY, minY, maxY })
		}, 100)
	}

	const onMouseMove = e => {
		if (!state.isDragging) return

		// update dragElement position
		dragElement.current.style.top = Math.min(state.maxY, Math.max(state.minY, e.clientY - state.startY)) + 'px'

		// find last element who's top is less than dragElement top
		let dropTarget
		let after = false
		const rect = dragElement.current.getBoundingClientRect()
		for (let i = 0; i < state.items.length; i++) {
			const item = state.items[i]
			const { top, bottom } = item.rect

			if (item.last) {
				if (rect.top > top && rect.top < bottom + 20) {
					dropTarget = item
					after = true
					break
				}
			}

			if (top >= rect.top) {
				if (item.ignore) {
					if (item.last) {
						after = true
					} else {
						continue
					}
				}

				dropTarget = item
				break
			}
		}
		if (!dropTarget) {
			dropTarget = state.items[state.items.length - 1]
			after = true
		}

		dragBorder.current.style.top = (after ? dropTarget.rect.bottom : dropTarget.rect.top) + 'px'

		dispatch({ type: 'DRAG_MOVE', dropId: dropTarget ? dropTarget.id : null, after })
	}

	const onMouseUp = useCallback(() => {
		if (timeRef.current) {
			clearTimeout(timeRef.current)
			timeRef.current = null
		}
		if (dragElement.current) {
			dragElement.current.remove()
			dragElement.current = null
		}
		if (dragBorder.current) {
			dragBorder.current.remove()
			dragBorder.current = null
		}

		dispatch({ type: 'DRAG_END' })
		if (dragId && dropId && dragId !== dropId) onChange({ dragId, dropId, after })
	}, [dragId, dropId, after])

	useEffect(() => {
		document.addEventListener('mousedown', onMouseDown)

		return () => {
			document.removeEventListener('mousedown', onMouseDown)
			if (timeRef.current) {
				clearTimeout(timeRef.current)
				timeRef.current = null
			}
		}
	}, [])

	useEffect(() => {
		const ref = listenerRef.current
		if (state.isDragging) {
			if (ref.mousemove !== onMouseMove) {
				if (ref.mousemove) document.removeEventListener('mousemove', ref.mousemove)
				document.addEventListener('mousemove', onMouseMove)
			}
			if (ref.mouseup !== onMouseUp) {
				if (ref.mouseup) document.removeEventListener('mouseup', ref.mouseup)
				document.addEventListener('mouseup', onMouseUp)
			}
			ref.mousemove = onMouseMove
			ref.mouseup = onMouseUp
		} else {
			document.removeEventListener('mousemove', onMouseMove)
			document.removeEventListener('mouseup', cancelDrag)
			document.removeEventListener('mouseup', onMouseUp)
			ref.mousemove = null
			ref.mouseup = null
		}
		return () => {
			document.removeEventListener('mousemove', onMouseMove)
			document.removeEventListener('mouseup', cancelDrag)
			document.removeEventListener('mouseup', onMouseUp)
			ref.mousemove = null
			ref.mouseup = null
		}
	}, [state.isDragging, onMouseMove, onMouseUp])

	return state
}

export default useDrag
