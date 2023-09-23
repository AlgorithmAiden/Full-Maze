//setup the canvas
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

/**make the canvas always fill the screen**/;
(function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    window.onresize = resize
})()

//for this code (as in code before this line), I almost always use the same stuff, so its going to stay here

//set the grid size
const targetCellSize = 100
const gx = Math.round(canvas.width / targetCellSize)
const bx = canvas.width / gx
const gy = Math.round(canvas.height / targetCellSize)
const by = canvas.height / gy

//fill the grid
let grid = []
for (let iy = 0; iy < gy; iy++) {
    grid[iy] = []
    let row = grid[iy]
    for (let ix = 0; ix < gx; ix++) {
        const cell = {}
        cell.x = ix
        cell.y = iy
        iy > 0 ? cell.up = true : null
        ix < gx - 1 ? cell.right = true : null
        iy < gy - 1 ? cell.down = true : null
        ix > 0 ? cell.left = true : null
        row[ix] = cell
    }
}

//will break the wall for both cells
function breakWall(x, y, side) {
    grid[y][x][side] = false
    if (side == 'up') {
        side = 'down'
        y--
    }
    else if (side == 'right') {
        side = 'left'
        x++
    }
    else if (side == 'down') {
        side = 'up'
        y++
    }
    else if (side == 'left') {
        side = 'right'
        x--
    }
    else throw 'not a valid side'
    grid[y][x][side] = false

}
//checks for included cell
function includesCell(stack, cell) {
    for (const item of stack)
        if (item.x == cell.x && item.y == cell.y)
            return true
    return false
}

//returns a list of all the cells in the area
//but will break if there is a loop
function findConnectedCells(x, y, stack = []) {
    const cell = grid[y][x]
    if (!includesCell(stack, cell)) {
        stack.push(cell)
        if (cell.up == false) stack = findConnectedCells(x, y - 1, stack)
        if (cell.right == false) stack = findConnectedCells(x + 1, y, stack)
        if (cell.down == false) stack = findConnectedCells(x, y + 1, stack)
        if (cell.left == false) stack = findConnectedCells(x - 1, y, stack)
    }
    return stack
}

//trys to break walls, recursively
function grow(x = 0, y = 0, home) {
    home = home ?? grid[y][x]

    const offset = Math.floor(Math.random() * 4)
    for (let index = 0; index < 4; index++) {

        if ((index + offset) % 4 == 0 && y > 0)
            if (!includesCell(findConnectedCells(x, y - 1), home)) {
                breakWall(x, y, 'up')
                grow(x, y - 1, home)
            }
        if ((index + offset) % 4 == 1 && x < gx - 1)
            if (!includesCell(findConnectedCells(x + 1, y), home)) {
                breakWall(x, y, 'right')
                grow(x + 1, y, home)
            }
        if ((index + offset) % 4 == 2 && y < gy - 1)
            if (!includesCell(findConnectedCells(x, y + 1), home)) {
                breakWall(x, y, 'down')
                grow(x, y + 1, home)
            }
        if ((index + offset) % 4 == 3 && x > 0)
            if (!includesCell(findConnectedCells(x - 1, y), home)) {
                breakWall(x, y, 'left')
                grow(x - 1, y, home)
            }
    }
}

//create the maze
grow()

//create the player
let player = {
    x: Math.floor(Math.random() * gx),
    y: Math.floor(Math.random() * gy)
}

//create the target
let target = {
    x: Math.floor(Math.random() * gx),
    y: Math.floor(Math.random() * gy)
}

//create the danger
let dangers = []
let dangerLevel = JSON.parse(sessionStorage.getItem('dangerLevel')) ?? 0
console.log(dangerLevel)
for (let index = 0; index < dangerLevel; index++)
    dangers.push({
        x: Math.floor(Math.random() * gx),
        y: Math.floor(Math.random() * gy)
    })

//the render function
function render() {
    //clear the screen
    ctx.fillStyle = 'rgb(0,0,0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    //render the player
    ctx.fillStyle = 'rgb(0,255,0,.5)'
    ctx.fillRect(player.x * bx, player.y * by, bx, by)

    //render the target
    ctx.fillStyle = 'rgb(0,0,255,.5)'
    ctx.fillRect(target.x * bx, target.y * by, bx, by)

    //render the dangers
    ctx.fillStyle = 'rgb(255,0,0,.5)'
    for (const danger of dangers)
        ctx.fillRect(danger.x * bx, danger.y * by, bx, by)

    //create the gradients
    const glowSize = (canvas.width + canvas.height) / 2 / (dangerLevel/2+1)
    const blueGradient = ctx.createRadialGradient(target.x * bx + bx / 2, target.y * by + by / 2, 0, target.x * bx + bx / 2, target.y * by + by / 2, glowSize)
    const greenGradient = ctx.createRadialGradient(player.x * bx + bx / 2, player.y * by + by / 2, 0, player.x * bx + bx / 2, player.y * by + by / 2, glowSize)
    const redGradients = []
    for (const danger of dangers) {
        const gradient = ctx.createRadialGradient(danger.x * bx + bx / 2, danger.y * by + by / 2, 0, danger.x * bx + bx / 2, danger.y * by + by / 2, glowSize)
        gradient.addColorStop(0, 'rgb(255,0,0)')
        gradient.addColorStop(1, 'rgb(0,0,0,.0)')
        redGradients.push(gradient)
    }
    blueGradient.addColorStop(0, 'rgb(0,0,255)')
    blueGradient.addColorStop(1, 'rgb(0,0,0,.0)')
    greenGradient.addColorStop(0, 'rgb(0,255,0)')
    greenGradient.addColorStop(1, 'rgb(0,0,0,.0)')

    //render the cells
    ctx.strokeStyle = 'rgb(0,255,0)'
    ctx.lineWidth = 5
    ctx.beginPath()
    for (let iy = 0; iy < gy; iy++) {
        let row = grid[iy]
        for (let ix = 0; ix < gx; ix++) {
            ctx.moveTo(ix * bx, iy * by)
            const cell = row[ix]
            if (cell.up) ctx.lineTo(ix * bx + bx, iy * by)
            else ctx.moveTo(ix * bx + bx, iy * by)
            if (cell.right) ctx.lineTo(ix * bx + bx, iy * by + by)
            else ctx.moveTo(ix * bx + bx, iy * by + by)
            if (cell.down) ctx.lineTo(ix * bx, iy * by + by)
            else ctx.moveTo(ix * bx, iy * by + by)
            if (cell.left) ctx.lineTo(ix * bx, iy * by)
            else ctx.moveTo(ix * bx, iy * by)
        }
    }
    ctx.strokeStyle = greenGradient
    ctx.stroke()
    ctx.strokeStyle = blueGradient
    ctx.stroke()
    for (const gradient of redGradients) {
        ctx.strokeStyle = gradient
        ctx.stroke()
    }

}

//render the start board
render()

//player movment
document.addEventListener('keydown', e => {
    const key = e.code
    const cell = grid[player.y][player.x]
    const lastLoc = [player.x, player.y]

    //move the player
    if (key == 'ArrowUp' && cell.up == false) player.y--
    if (key == 'ArrowRight' && cell.right == false) player.x++
    if (key == 'ArrowDown' && cell.down == false) player.y++
    if (key == 'ArrowLeft' && cell.left == false) player.x--

    function tryMove(dir, danger) {
        const cell = grid[danger.y][danger.x]
        let moved = false

        if (dir == 'up' && cell.up == false) { moved = true; danger.y-- }
        if (dir == 'right' && cell.right == false) { moved = true; danger.x++ }
        if (dir == 'down' && cell.down == false) { moved = true; danger.y++ }
        if (dir == 'left' && cell.left == false) { moved = true; danger.x-- }

        return moved
    }

    //check for danger eating player
    function checkDeath(danger) {
        if (danger.x == player.x && danger.y == player.y) {
            //reset the danger level if they die
            sessionStorage.clear('dangerLevel')
            window.location.reload()
        }
    }

    //check if the player moved
    if (player.x !== lastLoc[0] || player.y !== lastLoc[1]) {
        //move all the dangers
        for (let danger of dangers) {
            checkDeath(danger)
            let directions = ['up', 'right', 'down', 'left']
            while (directions.length > 0) {
                const index = Math.floor(Math.random() * directions.length)
                if (tryMove(directions[index], danger)) break
                else directions.splice(index, 1)
            }
            checkDeath(danger)
        }
    }

    //check for win
    if (player.x == target.x && player.y == target.y) {
        //make the next round more hard
        sessionStorage.setItem('dangerLevel', JSON.stringify(dangerLevel + 1))
        window.location.reload()
    }

    //render the move
    render()
})