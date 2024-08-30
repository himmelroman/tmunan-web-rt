import { useEffect, useRef, useState } from 'react'

const useDrag = ({ selectedNames, itemSelector, handleSelector, ignoreSelector, delay, onChange }) => {
	const oref = useRef({})
	const sref = useRef(selectedNames)

	const [isDragging, setIsDragging] = useState(false)

	useEffect(() => {
		sref.current = selectedNames
	}, [selectedNames])

	const startDrag = (e, item) => {
		const o = oref.current

		const parent = item.parentElement
		o.dragItems = sref.current?.length
			? sref.current.map(name => parent.querySelector(`[data-name="${name}"]`))
			: [item]
		item = o.dragItems[0]
		o.length = o.dragItems.length

		o.oldIndex = parseInt(item.dataset.index)
		o.originalOrder = item.style.order

		const { top, left } = item.getBoundingClientRect()
		o.clientY = e.clientY
		o.startY = e.clientY - top
		o.startX = e.clientX - left

		document.getSelection().empty()

		const siblings = Array.from(parent.querySelectorAll(itemSelector)).map((el, index) => {
			const { top, left, bottom, right, width, height } = el.getBoundingClientRect()
			return { el, name: el.dataset.name, index, top, left, bottom, right, width, height }
		})
		window.siblings = siblings

		o.minY = siblings[0].top
		o.maxY = siblings[siblings.length - o.length].top

		o.siblings = siblings
		let dragElement
		let innerHTML = ''
		o.dragItems.forEach(item => {
			innerHTML += item.outerHTML
			item.style.visibility = 'hidden'
		})

		dragElement = document.createElement('div')
		dragElement.className = 'dragged'
		dragElement.style.display = 'flex'
		dragElement.style.flexDirection = 'column'
		dragElement.style.alignItems = 'stretch'
		dragElement.dataset.dragged = true
		dragElement.innerHTML = innerHTML

		Object.assign(dragElement.style, {
			position: 'absolute',
			top: `${top}px`,
			left: `${left}px`,
			width: `${item.offsetWidth}px`,
			height: `${item.offsetHeight}px`,
			zIndex: 1000,
			pointerEvents: 'none',
			transition: 'none',
			boxShadow: '0 0 10px 0 #0002',
			userSelect: 'none',
			cursor: 'grabbing',
		})
		parent.appendChild(dragElement)
		o.dragElement = dragElement

		o.isDragging = true
		setIsDragging(true)
		onMouseMove(e)
	}

	const onMouseDown = e => {
		clearTimeout(oref.current.timeout)
		if (isDragging) return
		if (ignoreSelector && e.target.closest(ignoreSelector)) return
		if (handleSelector && !e.target.closest(handleSelector)) return
		const item = e.target.closest(itemSelector)
		if (!item) return

		document.addEventListener('pointerup', onMouseUp)
		document.addEventListener('pointermove', onMouseMove)

		if (delay) {
			oref.current.timeout = setTimeout(() => {
				startDrag(e, item)
			}, delay)
		} else {
			startDrag(e, item)
		}
	}

	const onMouseMove = e => {
		const o = oref.current
		clearTimeout(o.timeout)
		if (!o.isDragging) return

		const y = Math.min(o.maxY, Math.max(o.minY, e.clientY - o.startY))
		o.dragElement.style.top = `${y}px`
		const drag_bottom = y + o.dragElement.offsetHeight

		let newIndex
		for (newIndex = 0; newIndex < o.siblings.length; newIndex++) {
			const { top, height } = o.siblings[newIndex]
			if (top + height / 2 > drag_bottom) {
				newIndex -= 1
				break
			}
		}
		o.newIndex = newIndex
		const diff = newIndex - o.oldIndex

		o.siblings.forEach((sibling, i) => {
			if (i < o.oldIndex) {
				sibling.el.style.order = i >= newIndex ? i + o.length : i
			} else if (i < o.oldIndex + o.length) {
				sibling.el.style.order = i + diff
			} else {
				sibling.el.style.order = i < newIndex + o.length ? i - o.length : i
			}
		})
	}

	const onMouseUp = () => {
		document.removeEventListener('pointerup', onMouseUp)
		document.removeEventListener('pointermove', onMouseMove)
		clearTimeout(oref.current.timeout)
		if (!oref.current.isDragging) return

		const { oldIndex, newIndex, length, dragItems, dragElement, originalOrder } = oref.current
		oref.current.isDragging = false
		setIsDragging(false)
		dragElement.remove()
		dragItems.forEach(item => {
			item.style.visibility = ''
		})
		oref.current = {}
		if (oldIndex !== newIndex) onChange?.({ oldIndex, newIndex, length })
		else
			dragItems.forEach(item => {
				item.style.order = originalOrder
			})
	}

	useEffect(() => {
		document.addEventListener('pointerdown', onMouseDown)
		return () => {
			document.removeEventListener('pointerup', onMouseUp)
			document.removeEventListener('pointerdown', onMouseDown)
			document.removeEventListener('pointermove', onMouseMove)
		}
	}, [])

	return { isDragging }
}

export default useDrag
