import Phaser from "phaser"

let money = 0
let moneyMultiplier = Phaser.Math.Between(66, 133)

class Tower extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, range, attackSpeed){
        super(scene, x, y, "bow")
        scene.add.existing(this)
        this.setScale(.1)
        this.attackSpeed = attackSpeed
        this.range = range
        this.setInteractive()
        // this.rangeSprite = scene.add.image(x,y, "range")
        // this.rangeSprite.setSize((Math.Pi * this.range)**2)
        // this.rangeSprite.setDepth(-1)
    }

    // Make the tower aim at the closest enemy
    aimAtClosestEnemy(enemies){
        //maxrange of the tower
        
        let closestEnemy
        let distanceToEnemy = Infinity

        // for each enemy in the list, check the distance to the tower
        for (let enemy of enemies) {
            const distancex = enemy.x - this.x
            const distancey = enemy.y - this.y

            const distance = Math.sqrt(distancex*distancex + distancey*distancey) -12

            // if the distance is less than the closest enemy, and less than the range, set the closest enemy
            if (distance < distanceToEnemy && distance < this.range){
                closestEnemy = enemy
                distanceToEnemy = distance

            }
            
        }
        //rotate the tower to the closest enemy
        if (closestEnemy) {
            const newRotation = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x)

            const lerpedRot = Phaser.Math.Linear(this.rotation, newRotation, .09)
            this.rotation = lerpedRot
            return closestEnemy
            // this.rotation = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x)
        }
    
    }

    

    
        
    
}


class Bullet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, bulletSpeed, damage, range){
        super(scene, x, y, "bullet")
        scene.add.existing(this)
        this.damage = damage
        this.bulletSpeed = bulletSpeed
        this.range = range
        this.setScale(.5)
    }
    
    //shoot at the closest enemy
    shootAtEnemy(target){
        // let bulletSpeed = 10

        if (target){
            this.rotation = Math.atan2(target.y - this.y, target.x - this.x)
            const directionx = target.x - this.x
            const directiony = target.y - this.y
                
            const distance = Math.sqrt(directionx * directionx + directiony * directiony)

            // get rid of the bullet when it gets close
            if (distance <= 10){
                this.target.health -= this.damage
                this.destroy()
            }
            else if (distance > this.range){
                this.destroy()
            }
            else{
                this.x += (directionx / distance) * this.bulletSpeed
                this.y += (directiony / distance) * this.bulletSpeed
            }
        }
        else{
            this.destroy()
        }
        
        
    }
    


}







// enemy class is an enemy in the game
class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, health) {
        //calling the parent sprite constructor
        // scene, current game scene
        //x, y, start pos
        // drone is the image
        super(scene, x, y, "drone")
        scene.add.existing(this) //add the enemy to the scene
        this.setScale(0.2) // make the enemy smaller
        this.pathPoint = 0 // track the point on the path the enemy is moving to
        this.fullHealth = health
        this.health = health
        this.setInteractive()
        this.distance
        this.sixtysixPercent = false
        this.thirtythreePercent = false


    }

    
    moveAlongPath(pathPoints, speed) {
        //move if there are more points
        if (this.health > 0){
            if (this.pathPoint < pathPoints.length) {
                const target = pathPoints[this.pathPoint]

                const directionx = target.x - this.x
                const directiony = target.y - this.y
                
                const distance = Math.sqrt(directionx * directionx + directiony * directiony)

                if (distance <= 5) {
                    
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
                this.pathPoint = 0
                this.x = pathPoints[0].x
                this.y = pathPoints[0].y
            }
        }
        else{
            money += moneyMultiplier 
            this.destroy()
        }
    }

    // giveMoney(multiplier, health, fullHealth, variable){
    //     if (health < fullHealth*multiplier){
    //         money += 100
    //         variable = true
    //     }
    // }


}


class MainScene extends Phaser.Scene {
    

    preload() {
        console.log("preload")
        this.load.image("drone", "Drone.png")
        this.load.image("bow", "Sci-Fi Bow.png")
        this.load.image("bullet", "Bullet.png")
        this.load.image("range", "Range.png")
    }

    create() {
        this.paused = false
        console.log("create")
        this.drawPath()
        // money = money.toString()
        this.moneyText = this.add.text(20, 20, money)
        const baseRadius = 100;
        const rangeKey = 'rangeCircle';
        if (!this.textures.exists(rangeKey)) {
            const g = this.make.graphics({x: 0, y: 0, add: false});
            g.fillStyle(0x57B9FF, 0.3);
            g.fillCircle(baseRadius, baseRadius, baseRadius);
            g.generateTexture(rangeKey, baseRadius * 2, baseRadius * 2);
            g.destroy();
}
        this.bows = []

        this.input.on("pointerdown", (pointer) => {
            const newBow = new Tower(this, pointer.x, pointer.y, 200, 300)
            this.bows.push(newBow)
            newBow.on('pointerover', () => {
                if (!newBow.rangeSprite){
                    newBow.rangeSprite = this.add.image(newBow.x, newBow.y, rangeKey);
                    // Scale so the displayed radius matches newBow.range
                    const scale = newBow.range / baseRadius;
                    newBow.rangeSprite.setScale(scale);
                    newBow.rangeSprite.setDepth(-1);
                    
                }
                this.scene.pause()
                
            })
            newBow.on('pointerout', () => {
                this.scene.resume()
                if (newBow.rangeSprite){
                    
                    console.log("offbow")
                    newBow.rangeSprite.destroy()
                    newBow.rangeSprite = null
                    
                }
            })
            

            this.time.addEvent({
            delay: newBow.attackSpeed,
            loop: true,
            callback: () => {
            const closest = newBow.aimAtClosestEnemy(this.amountOfEnimies)
            if (closest) {
                const bullet = new Bullet(this, newBow.x, newBow.y, 20, 100, newBow.range)
                bullet.target = closest
                this.bullets.push(bullet)
            }
        }
    })
        })

        // every second, for 5 seconds, add an enemy to the list
        this.amountOfEnimies= []
        this.time.addEvent({
            delay: 1000,
            repeat: 10,
            callback: () =>{
                const enemy = new Enemy(this, this.pathPoints[0].x, this.pathPoints[0].y, 100000);
                enemy.on('pointerover', () => {
                    if (!enemy.healthText){
                        enemy.healthText = this.add.text(enemy.x, enemy.y, enemy.health, {
                            fontSize: "50px",
                            fill: "#000000"
                        })
                    }

                });
                enemy.on('pointerout', () => {
                    if (enemy.healthText) {
                        enemy.healthText.destroy();
                        enemy.healthText = null;
                    }
                });
this.amountOfEnimies.push(enemy);
            }
        })
        
        //spawn the bow
        
    
        //make bullets spawn on the bow every second

        this.bullets = []
    




       

    }

    update() {
        if (this.paused) return
        this.moneyText.setText(money)
        let moneyMultiplier = Phaser.Math.Between(66, 133)
        // move the enemies along the path
        for (let i = 0; i < this.amountOfEnimies.length; i++){
            this.amountOfEnimies[i].moveAlongPath(this.pathPoints, 1)  
            if (this.amountOfEnimies[i].health < this.amountOfEnimies[i].fullHealth *.66 && !this.amountOfEnimies[i].sixtysixPercent){
                money += moneyMultiplier
                this.amountOfEnimies[i].sixtysixPercent = true
            }
            if (this.amountOfEnimies[i].health < this.amountOfEnimies[i].fullHealth *.33 && !this.amountOfEnimies[i].thirtythreePercent){
                money += moneyMultiplier
                this.amountOfEnimies[i].thirtythreePercent = true
            }
            
            if (this.amountOfEnimies[i].healthText){
                this.amountOfEnimies[i].healthText.setPosition(this.amountOfEnimies[i].x, this.amountOfEnimies[i].y)
                this.amountOfEnimies[i].healthText.setText(this.amountOfEnimies[i].health)
            }
        }
        this.amountOfEnimies = this.amountOfEnimies.filter(enemy => enemy.active)
        
        for (let bow of this.bows) {
            bow.aimAtClosestEnemy(this.amountOfEnimies)
            
            
        }
        

        // aim the bow at the closest enemy and shoot bullets
        // const closest = this.bow.aimAtEnemy(this.amountOfEnimies)
        for (let bullet of this.bullets){
            bullet.shootAtEnemy(bullet.target)

        }
        this.bullets = this.bullets.filter(bullet => bullet.active)
        
    }

    
    drawPath() {
        // Make a path for the enemies
        const graphics = this.add.graphics()
        graphics.lineStyle(50, 0xffffff, 1)

        graphics.beginPath()
        graphics.moveTo(0, 100)
        graphics.moveTo(1, 100)
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