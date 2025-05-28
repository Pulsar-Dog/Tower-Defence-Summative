import Phaser from "phaser"

// import { * } from "asdasd.js"
class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "drone")
        scene.add.existing(this)
        this.setScale(0.2)
        this.pathIndex = 0

    }

    moveAlongPath(pathPoints, speed = 2) {

    }
}


class MainScene extends Phaser.Scene {
    preload() {
        console.log("preload")
        this.load.image("drone", "Drone.png")
    }

    create() {
        console.log("create")
        this.drawPath()

        this.enemy = new Enemy(this, this.pathPoints[0].x, this.pathPoints[0].y)
    }

    update() {
        console.log("update")
    }

    drawPath() {
        // Make a path for the enemies
        const graphics = this.add.graphics()
        graphics.lineStyle(50, 0xffffff, 1)

        graphics.beginPath()
        graphics.moveTo(0, 100)
        graphics.lineTo(850, 100)
        graphics.lineTo(850, 300)
        graphics.lineTo(1000, 300)
        graphics.lineTo(1000, 450)
        graphics.lineTo(650, 450)
        graphics.lineTo(650, 240)
        graphics.lineTo(100, 240)
        graphics.lineTo(100, 550)
        graphics.lineTo(300, 550)
        graphics.lineTo(300, 400)
        graphics.lineTo(460, 400)
        graphics.lineTo(460, 650)
        graphics.strokePath()

        this.pathPoints = [
            {x: 0, y: 100},
            {x: 850, y: 100},
            {x: 850, y: 300},
            {x: 1000, y: 300},
            {x: 1000, y: 450},
            {x: 650, y: 450},
            {x: 650, y: 240},
            {x: 100, y: 240},
            {x: 100, y: 550},
            {x: 300, y: 550},
            {x: 300, y: 400},
            {x: 460, y: 400},
            {x: 460, y: 650}
        ]


    }
}



















const config = {
    type: Phaser.WEBGL,
    width: 1100,
    height: 650,
    scene: [MainScene],
    scale: {mode: Phaser.Scale.FIT},
    backgroundColor: 0x006400,

    physics: {
        default: "arcade",
        arcade: {
            gravity: {x: 0, y: 0}
        }
    }
}

new Phaser.Game(config)