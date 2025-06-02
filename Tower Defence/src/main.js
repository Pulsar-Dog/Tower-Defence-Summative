import Phaser from "phaser"

// import { * } from "asdasd.js"

class Tower extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y){
        super(scene, x, y, "bow")
        scene.add.existing(this)
        this.setScale(.1)
    }

    aimAtEnemy(enemies){
        let range = 500
        let closestEnemy
        let distanceToEnemy = 1000

        for (let enemy of enemies) {
            const distancex = enemy.x - this.x
            const distancey = enemy.y - this.y

            const distance = Math.sqrt(distancex*distancex + distancey*distancey)

            if (distance < distanceToEnemy && distance < range){
                closestEnemy = enemy
                distanceToEnemy = distance

            }
            
        }
        if (closestEnemy) {
            const newRotation = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x)

            const lerpedRot = Phaser.Math.Linear(this.rotation, newRotation, 0.2)
            this.rotation = lerpedRot
            // this.rotation = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x)
        }
        return closestEnemy
    }

    
        
    
}


class Bullet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y){
        super(scene, x, y, "bullet")
        scene.add.existing(this)
        this.setScale(.5)
    }
    
    shootAtEnemy(target){
        this.rotation = Math.atan2(target.y - this.y, target.x - this.x)
        const directionx = target.x - this.x
        const directiony = target.y - this.y
            
        const distance = Math.sqrt(directionx * directionx + directiony * directiony)

        if (distance <= 10){
            this.destroy()
        }
        else{
            this.x += (directionx / distance) * 30
            this.y += (directiony / distance) * 30
        }
    }


}







// enemy class is an enemy in the game
class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        //calling the parent sprite constructor
        // scene, current game scene
        //x, y, start pos
        // drone is the image
        super(scene, x, y, "drone")
        scene.add.existing(this) //add the enemy to the scene
        this.setScale(0.2) // make the enemy smaller
        this.pathPoint = 0 // track the point on the path the enemy is moving to
        this.health = 100

    }

    moveAlongPath(pathPoints, speed = 2) {
        //move if there are more points
        if (this.pathPoint < pathPoints.length) {
            const target = pathPoints[this.pathPoint]

            const directionx = target.x - this.x
            const directiony = target.y - this.y
            
            const distance = Math.sqrt(directionx * directionx + directiony * directiony)

            if (distance <= 0) {
                
                this.pathPoint ++
                // let rotateAmount = .9
                // let count = 0
                
                // const nextPoint = pathPoints[this.pathPoint]
                // const nextDirectionx = nextPoint.x - this.x
                // const nextDirectiony = nextPoint.y - this.y

                // if (this.rotatingInterval){
                //     clearInterval(this.rotatingInterval)
                // }
                // this.rotatingInterval = setInterval(() => {
                //     this.rotation = Math.atan2(nextDirectiony - (nextDirectiony * rotateAmount), nextDirectionx - (nextDirectionx * rotateAmount))
                //     rotateAmount -= .1
                //     count ++
                //     if (count >= 9){
                //         clearInterval(this.rotatingInterval)
                //     }
                // }, 100)
                
            }
            else{
                this.x += (directionx / distance) * speed
                this.y += (directiony / distance) * speed
                this.rotation = Math.atan2(directiony, directionx)


                
                
            }
        }
        else{
            this.destroy()
        }
    }
}


class MainScene extends Phaser.Scene {
    

    preload() {
        console.log("preload")
        this.load.image("drone", "Drone.png")
        this.load.image("bow", "Sci-Fi Bow.png")
        this.load.image("bullet", "Bullet.png")
    }

    create() {
        console.log("create")
        this.drawPath()
        this.amountOfEnimies= []

        this.time.addEvent({
            delay: 1000,
            repeat: 4,
            callback: () =>{
                 this.amountOfEnimies.push(new Enemy(this, this.pathPoints[0].x, this.pathPoints[0].y))
            }
        })
        
        this.bow = new Tower(this, 800, 200)
    
        this.bullets = []
        
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                const closest = this.bow.aimAtEnemy(this.amountOfEnimies) 
                if (closest){
                    const bullet = new Bullet(this, this.bow.x, this.bow.y)
                    this.bullets.push(bullet)
                }
            }
        })


       

    }

    update() {
        console.log("update")
        for (let i = 0; i < this.amountOfEnimies.length; i++){
            this.amountOfEnimies[i].moveAlongPath(this.pathPoints, 2)    
        }
        const closest = this.bow.aimAtEnemy(this.amountOfEnimies)
        for (let bullet of this.bullets){
            if (closest){
                bullet.shootAtEnemy(closest)
            }
        }
        
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