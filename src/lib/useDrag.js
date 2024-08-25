import { useEffect, useRef, useState } from 'react'

const useDrag = ({ items, itemSelector, handleSelector, ignoreSelector, onChange }) => {
	const listenerRef = useRef({})
	const oref = useRef({})
	const itemRefs = useRef([])

	const [isDragging, setIsDragging] = useState(false)

	const onMouseDown = e => {
		if (isDragging) return
		const handle = e.target.closest(handleSelector || itemSelector)
		if (!handle) return

		const o = oref.current
		const item = e.target.closest(itemSelector)
		o.oldIndex = parseInt(item.dataset.index)

		const { top, left } = item.getBoundingClientRect()
		o.startY = e.clientY - top + 1
		o.startX = e.clientX - left

		document.getSelection().empty()

		const rects = Array.from(item.parentElement.querySelectorAll(itemSelector)).map((el, index) => {
			const { top, left, bottom, right, width, height } = el.getBoundingClientRect()
			return { el, index, top, left, bottom, right, width, height, ignore: el.matches(ignoreSelector) }
		})

		o.minY = rects[0].top + o.startY
		o.maxY = rects[rects.length - 1].top + o.startY

		itemRefs.current = rects

		// create copy of target item to drag
		const del = item.cloneNode(true)
		del.className = `${del.className} dragged`

		del.style.position = 'absolute'
		del.style.top = item.offsetTop + 'px'
		del.style.left = item.offsetLeft + 'px'
		del.style.width = item.offsetWidth + 'px'
		del.style.height = item.offsetHeight + 'px'
		del.style.zIndex = 1000
		del.style.pointerEvents = 'none'
		del.style.transition = 'none'
		del.style.boxShadow = '0 0 10px 0 rgba(0, 0, 0, 0.2)'
		del.style.userSelect = 'none'
		del.style.cursor = 'grabbing'
		del.dataset.index = o.oldIndex
		del.innerHTML = item.innerHTML
		item.parentElement.appendChild(del)

		o.dragElement = del

		o.original = item
		o.original_order = item.style.order
		item.style.visibility = 'hidden'

		setIsDragging(true)
		onMouseMove(e)
	}

	const onMouseMove = e => {
		const o = oref.current
		const y = Math.min(o.maxY, Math.max(o.minY, e.clientY))

		const rects = itemRefs.current
		let i
		for (i = 0; i < rects.length; i++) {
			const { bottom, ignore } = rects[i]
			if (ignore) continue
			if (bottom > y) {
				break
			}
		}
		o.newIndex = i

		o.dragElement.style.top = `${y - o.startY}px`
		const after = i > o.oldIndex
		o.original.style.order = i * 2 + (after ? 2 : 0)
	}

	const onMouseUp = () => {
		if (!isDragging) return
		const { oldIndex, newIndex, original, dragElement, original_order } = oref.current
		setIsDragging(false)
		dragElement.remove()
		original.style.visibility = ''
		original.style.order = original_order
		delete oref.current.startY
		delete oref.current.startX
		delete oref.current.minY
		delete oref.current.maxY
		delete oref.current.original_order
		delete oref.current.original
		delete oref.current.dragElement
		delete oref.current.oldIndex
		delete oref.current.newIndex
		if (oldIndex !== newIndex) onChange?.({ oldIndex, newIndex })
	}

	useEffect(() => {
		document.addEventListener('pointerdown', onMouseDown)
		return () => {
			document.removeEventListener('pointerdown', onMouseDown)
		}
	}, [])

	useEffect(() => {
		const ref = listenerRef.current
		if (isDragging) {
			if (ref.mousemove !== onMouseMove) {
				if (ref.mousemove) document.removeEventListener('pointermove', ref.mousemove)
				document.addEventListener('pointermove', onMouseMove)
			}
			if (ref.mouseup !== onMouseUp) {
				if (ref.mouseup) document.removeEventListener('pointerup', ref.mouseup)
				document.addEventListener('pointerup', onMouseUp)
			}
			ref.mousemove = onMouseMove
			ref.mouseup = onMouseUp
		} else {
			document.removeEventListener('pointermove', onMouseMove)
			document.removeEventListener('pointerup', onMouseUp)
			ref.mousemove = null
			ref.mouseup = null
		}
		return () => {
			document.removeEventListener('pointermove', onMouseMove)
			document.removeEventListener('pointerup', onMouseUp)
			ref.mousemove = null
			ref.mouseup = null
		}
	}, [isDragging])

	return { isDragging, items }
}

export default useDrag
