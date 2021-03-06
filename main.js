'use strict'

const canvas = document.getElementById('pathscreen')
const ctx = canvas.getContext('2d')
if (!ctx) alert('Canvas not supported')

const startNodeInput = document.getElementById('startNode')
const goalNodeInput = document.getElementById('goalNode')
const launchBtn = document.getElementById('launchBtn')

const COLORS = {
	BLACK: 'rgb(0,0,0)',
	GREEN: 'rgb(88,239,98)',
	PINK: 'rgb(252,106,240)',
	YELLOW: 'rgb(252,248,45)',
	LIGHT_BLUE: 'rgb(7,240,252)',
	BLUE: 'rgb(73,73,252)',
	GREY: 'rgb(163, 163, 163)',
	TRANSPARENT: 'rgb(255,255,255)'
}
const START_COLOR = COLORS.BLUE
const GOAL_COLOR = COLORS.GREEN
const OBSTACLE_COLOR = COLORS.BLACK
const CLOSED_SET_COLOR = COLORS.LIGHT_BLUE
const OPEN_SET_COLOR = COLORS.PINK
const PATH_COLOR = COLORS.YELLOW
const EMPTY_NODE_COLOR = COLORS.GREY

const CELL_RADIUS = 6
const SPEED = 0.08
const OBSTACLES = 150
const START_INDEX = startNodeInput.value
const GOAL_INDEX = goalNodeInput.value

/**
 * Node constructor
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} i Index in the array
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

	this.draw = function (color, status = null) {
		if (status === 'empty') {
			ctx.strokeStyle = color
			ctx.beginPath()
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
			ctx.stroke()
		} else {
			ctx.fillStyle = color
			ctx.beginPath()
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
			ctx.fill()
		}
	}
}

/**
 * Grid constructor, draw and store all nodes
 */
function Grid() {
	this.nodes = []
	this.countNode = 0
	this.cellRadius = CELL_RADIUS

	this.create = function () {
		for (let x = this.cellRadius; x <= canvas.width; x += this.cellRadius * 2) {
			for (let y = this.cellRadius; y <= canvas.height; y += this.cellRadius * 2) {
				const node = new Node(x, y, this.countNode, this)
				node.draw(EMPTY_NODE_COLOR, 'empty')
				this.nodes.push(node)
				this.countNode += 1
			}
		}
	}
}

/**
 * Get all neighbors (up, down, right, left and diagonals) of a node
 * @param {Grid} grid 
 * @param {Node} node 
 */
function getNeighbors(grid, node) {
	const offset = CELL_RADIUS * 2
	const x = node.x
	const y = node.y
	const neighbors = []

	const upIndex = grid.nodes.findIndex((el) => el.x === x && el.y === y - offset)
	const downIndex = grid.nodes.findIndex((el) => el.x === x && el.y === y + offset)
	const rightIndex = grid.nodes.findIndex((el) => el.x === x + offset && el.y === y)
	const leftIndex = grid.nodes.findIndex((el) => el.x === x - offset && el.y === y)
	const diagDownRight = grid.nodes.findIndex((el) => el.x === x + offset && el.y === y + offset)
	const diagDownLeft = grid.nodes.findIndex((el) => el.x === x - offset && el.y === y + offset)
	const diagUpRight = grid.nodes.findIndex((el) => el.x === x + offset && el.y === y - offset)
	const diagUpLeft = grid.nodes.findIndex((el) => el.x === x - offset && el.y === y - offset)

	if (grid.nodes[upIndex]) neighbors.push(grid.nodes[upIndex])
	if (grid.nodes[downIndex]) neighbors.push(grid.nodes[downIndex])
	if (grid.nodes[rightIndex]) neighbors.push(grid.nodes[rightIndex])
	if (grid.nodes[leftIndex]) neighbors.push(grid.nodes[leftIndex])
	if (grid.nodes[diagDownRight]) neighbors.push(grid.nodes[diagDownRight])
	if (grid.nodes[diagDownLeft]) neighbors.push(grid.nodes[diagDownLeft])
	if (grid.nodes[diagUpRight]) neighbors.push(grid.nodes[diagUpRight])
	if (grid.nodes[diagUpLeft]) neighbors.push(grid.nodes[diagUpLeft])

	return neighbors
}

/**
 * Create and draw n obstacles on grid
 * @param {Number} n 
 * @param {Grid} grid 
 */
function makeObstacles(n, grid) {
	for (let i = 0; i <= n; i++) {
		let randIndex = Math.floor(Math.random() * (2499 - 0) + 0)
		let obstacle = grid.nodes[randIndex]
		obstacle.isObstacle = true
		obstacle.draw(OBSTACLE_COLOR)
	}
}

/**
 * Remove elt from arr
 * @param {Array} arr 
 * @param {*} elt 
 */
function removeFromArray(arr, elt) {
	// Could use indexOf here instead to be more efficient
	for (let i = arr.length - 1; i >= 0; i--) {
		if (arr[i] === elt) {
			arr.splice(i, 1)
		}
	}
}

/**
 * Calculate distance between a and b
 * @param {Node} a 
 * @param {Node} b 
 */
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
	let path = []
	openSet.push(start)

	// Storing the setInterval to call clearInterval later
	let inter = setInterval(() => {

		if (openSet.length > 0) {

			let winner = 0

			for (let i = 0; i < openSet.length; i++) {
				if (openSet[i].f < openSet[winner].f) {
					winner = i
				}
			}

			let current = openSet[winner]

			// Arrived at destination
			if (current === goal) {
				console.log("ARRIVED")
				document.getElementById('finishMessage').textContent = "Arrived!"
				clearInterval(inter)
				return 1
			}

			// Best option moves from openSet to closedSet
			removeFromArray(openSet, current)
			closedSet.push(current)

			let neighbors = getNeighbors(grid, current)

			for (const neighbor of neighbors) {

				if (!closedSet.includes(neighbor) && !neighbor.isObstacle) {

					let tempG = current.g + heuristic(neighbor, current)
					let newPath = false

					if (openSet.includes(neighbor)) {
						if (tempG < neighbor.g) {
							newPath = true
						}
					} else {
						neighbor.g = tempG
						newPath = true
						openSet.push(neighbor)
					}

					if (newPath) {
						neighbor.h = heuristic(neighbor, goal)
						neighbor.f = neighbor.g + neighbor.h
						neighbor.previous = current
					}
				}
			}

			//region Find and draw the path by working backwards
			path = []
			let temp = current
			path.push(temp)

			while (temp.previous) {
				path.push(temp.previous)
				temp = temp.previous
			}

			for (let p of path) {
				grid.nodes[p.index].draw(PATH_COLOR)
			}
			//endregion

		} else {
			console.log('NO SOLUTION')
			return 0
		}

		for (let n of closedSet) {
			if (!path.includes(n)) grid.nodes[n.index].draw(CLOSED_SET_COLOR)
		}
		for (let n of openSet) {
			if (!path.includes(n)) grid.nodes[n.index].draw(OPEN_SET_COLOR)
		}

	}, SPEED * 1000)
}


const grid = new Grid()
grid.create()


let start = grid.nodes[START_INDEX]
let goal = grid.nodes[GOAL_INDEX]


start.draw(START_COLOR)
goal.draw(GOAL_COLOR)


startNodeInput.addEventListener('change', (e) => {
	start.draw(COLORS.TRANSPARENT)
	start = grid.nodes[e.target.value]
	start.draw(START_COLOR)
})


goalNodeInput.addEventListener('change', (e) => {
	goal.draw(COLORS.TRANSPARENT)
	goal = grid.nodes[e.target.value]
	goal.draw(GOAL_COLOR)
})


makeObstacles(OBSTACLES, grid)


launchBtn.addEventListener('click', (e) => {
	AStar(grid, start, goal)
	e.target.disabled = true
})