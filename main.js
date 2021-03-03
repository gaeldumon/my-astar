'use strict'

const canvas = document.getElementById('pathscreen')
const ctx = canvas.getContext('2d')
const CELL_RADIUS = 6
const SPEED = 0.1

/**
 * Node constructor
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} i Index in the array
 * @param {Grid} grid Grid where the node is
 * @return void
 */
function Node(x, y, i) {
	this.x = x
	this.y = y
	this.f = 0
	this.g = 0
	this.h = 0
	this.previous = 0
	this.index = i
	this.isObstacle = false

	this.radius = CELL_RADIUS
	this.color = 'rgb(163, 163, 163)'
	this.colorFilled = 'rgb(0, 0, 0)'
	this.colorFilledArrival = 'rgb(88, 239, 98)'
	this.colorFilledStart = 'rgb(73, 73, 252)'
	this.colorFilledNeighbor = 'rgb(252, 106, 240)'
	this.colorFilledPath = 'rgb(7, 240, 252)'

	this.draw = function () {
		ctx.strokeStyle = this.color
		ctx.beginPath()
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
		ctx.stroke()
	}

	this.drawFilled = function (type) {
		if (type === 'start') {
			ctx.fillStyle = this.colorFilledStart
		} else if (type === 'goal') {
			ctx.fillStyle = this.colorFilledArrival
		} else if (type === 'neighbor') {
			if (this.isObstacle) {
				ctx.fillStyle = 'rgba(0, 0, 0, 0)'
			} else {
				ctx.fillStyle = this.colorFilledNeighbor
			}
		} else if (type === 'path') {
			ctx.fillStyle = this.colorFilledPath
		} else if (type === 'obstacle') {
			ctx.fillStyle = this.colorFilled
		} else {
			ctx.fillStyle = this.colorFilled
		}
		ctx.beginPath()
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
		ctx.fill()
	}
}

/**
 * Grid constructor, draw and store all nodes
 */
function Grid() {
	this.nodes = []
	this.countNode = 0;
	this.cellRadius = CELL_RADIUS

	this.create = function () {
		for (let x = this.cellRadius; x <= canvas.width; x += this.cellRadius * 2) {
			for (let y = this.cellRadius; y <= canvas.height; y += this.cellRadius * 2) {
				const node = new Node(x, y, this.countNode, this)
				this.countNode += 1
				node.draw()
				this.nodes.push(node)
			}
		}
	}
}

function getNeighbors(grid, node) {
	const saut = CELL_RADIUS * 2
	const x = node.x
	const y = node.y
	const neighbors = []

	const upIndex = grid.nodes.findIndex((el) => el.x === x && el.y === y - saut)
	const downIndex = grid.nodes.findIndex((el) => el.x === x && el.y === y + saut)
	const rightIndex = grid.nodes.findIndex((el) => el.x === x + saut && el.y === y)
	const leftIndex = grid.nodes.findIndex((el) => el.x === x - saut && el.y === y)
	const diagDownRight = grid.nodes.findIndex((el) => el.x === x + saut && el.y === y + saut)
	const diagDownLeft = grid.nodes.findIndex((el) => el.x === x - saut && el.y === y + saut)
	const diagUpRight = grid.nodes.findIndex((el) => el.x === x + saut && el.y === y - saut)
	const diagUpLeft = grid.nodes.findIndex((el) => el.x === x - saut && el.y === y - saut)

	if (grid.nodes[upIndex]) neighbors.push(grid.nodes[upIndex])
	if (grid.nodes[downIndex]) neighbors.push(grid.nodes[downIndex])
	if (grid.nodes[rightIndex]) neighbors.push(grid.nodes[rightIndex])
	if (grid.nodes[leftIndex]) neighbors.push(grid.nodes[leftIndex])
	if (grid.nodes[diagDownRight]) neighbors.push(grid.nodes[diagDownRight])
	if (grid.nodes[diagDownLeft]) neighbors.push(grid.nodes[diagDownLeft])
	if (grid.nodes[diagUpRight]) neighbors.push(grid.nodes[diagUpRight])
	if (grid.nodes[diagUpLeft]) neighbors.push(grid.nodes[diagUpLeft])

	for (let n of neighbors) n.drawFilled('neighbor')

	return neighbors
}

/**
 * 
 * @param {Number} n 
 * @param {Grid} grid 
 */
function makeObstacles(n, grid) {
	for (let i = 0; i <= n; i++) {
		let randIndex = Math.floor(Math.random() * (2499 - 0) + 0)
		let randObstacle = grid.nodes[randIndex]
		randObstacle.isObstacle = true
		randObstacle.drawFilled('obstacle')
	}
}

function removeFromArray(arr, elt) {
	// Could use indexOf here instead to be more efficient
	for (let i = arr.length - 1; i >= 0; i--) {
		if (arr[i] === elt) {
			arr.splice(i, 1)
		}
	}
}

function dist(a, b) {
	const x = a.x - b.x
	const y = a.y - b.y
	const d = Math.sqrt(x * x + y * y)
	return d
}

function heuristic(a, b) {
	const h = dist(a, b)
	return h
}

function AStar(grid, start, goal) {
	let openSet = []
	let closedSet = []
	openSet.push(start)

	let inter = setInterval(() => {
		if (openSet.length > 0) {
			let winner = 0
			for (let i = 0; i < openSet.length; i++) {
				if (openSet[i].f < openSet[winner].f) {
					winner = i
				}
			}
			let current = openSet[winner]

			if (current === goal) {
				console.log("ARRIVED")
				clearInterval(inter)
				return 1;
			}

			// Best option moves from openSet to closedSet
			removeFromArray(openSet, current)
			closedSet.push(current)

			let neighbors = getNeighbors(grid, current)
			for (const nei of neighbors) {
				if (!closedSet.includes(nei) && !nei.isObstacle) {
					let tempG = current.g + heuristic(nei, current)
					let newPath = false

					if (openSet.includes(nei)) {
						if (tempG < nei.g) {
							newPath = true
						}
					} else {
						nei.g = tempG
						newPath = true
						openSet.push(nei)
					}

					if (newPath) {
						nei.h = heuristic(nei, goal)
						nei.f = nei.g + nei.h
						nei.previous = current
					}
				}
			}
		} else {
			console.log('NO SOLUTION')
			return 0;
		}

		for (let n of closedSet) {
			grid.nodes[n.index].drawFilled('path')
		}

	}, SPEED * 1000)
}


const grid = new Grid()
grid.create()

const start = grid.nodes[0]
const goal = grid.nodes[2499]

makeObstacles(100, grid)

start.drawFilled('start')
goal.drawFilled('goal')

const launchBtn = document.getElementById('launchBtn')
launchBtn.addEventListener('click', () => {
	AStar(grid, start, goal)
})