import Phaser from "phaser"
// This is a simple tower defense game where you can place towers to shoot at enemies
// The game has a main scene, a menu scene, and a death scene
let money = 1000
let moneyMultiplier = Phaser.Math.Between(66, 133)/100
let inventory = []
let bowInventory = []
let baseMoney = 300
let growthRate = 1.01

// Tower class is a tower that can shoot at enemies
// It has a range, attack speed, and can upgrade its range and attack speed
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

    // Upgrade the tower's range and attack speed
    upgradeRange(amount){
        this.range = Math.min(400, this.range + amount)
        
    }
    // Upgrade the tower's attack speed
    upgradeAttackSpeed(amount) {
    this.attackSpeed = Math.max(10, this.attackSpeed - amount)
    // newBow.bulletTimer.delay = this.attackSpeed
    this.bulletTimer.delay = this.attackSpeed
    
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

// Bullet class is a bullet that can shoot at enemies
class Bullet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, bulletSpeed, damage, range){
        super(scene, x, y, "bullet")
        scene.add.existing(this)
        this.damage = damage
        this.bulletSpeed = bulletSpeed
        this.range = range
        this.setScale(.5)
    }
    // Upgrade the bullet's damage
    upgradeDamage(amount){
        this.damage += amount
    }
    
    //shoot at the closest enemy
    shootAtEnemy(target){
        // let bulletSpeed = 10

        if (target){
            this.rotation = Math.atan2(target.y - this.y, target.x - this.x)
            const directionx = target.x - this.x
            const directiony = target.y - this.y
            
            // calculate the distance to the target
            const distance = Math.sqrt(directionx * directionx + directiony * directiony)

            // get rid of the bullet when it gets close
            if (distance <= 10){
                this.target.health -= this.damage
                this.destroy()
            }
            // if the distance is greater than the range, destroy the bullet
            else if (distance > this.range){
                this.destroy()
            }
            // move the bullet towards the target
            else{
                this.x += (directionx / distance) * this.bulletSpeed
                this.y += (directiony / distance) * this.bulletSpeed
            }
        }
        // if the target is null, destroy the bullet
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

    // move the enemy along the path
    moveAlongPath(pathPoints, speed) {
        //move if there are more points
        if (this.health > 0){
            if (this.pathPoint < pathPoints.length) {
                const target = pathPoints[this.pathPoint]

                const directionx = target.x - this.x
                const directiony = target.y - this.y
                // calculate the distance to the target
                const distance = Math.sqrt(directionx * directionx + directiony * directiony)

                // if the distance is less than 5, move to the next point
                if (distance <= 5) {
                    
                    this.pathPoint ++
                
                }
                // if the distance is greater than 5, move towards the target
                // and rotate towards the target
                else{
                    this.x += (directionx / distance) * speed
                    this.y += (directiony / distance) * speed
                    this.rotation = Math.atan2(directiony, directionx)


                    
                    
                }
            }
            // if the enemy has reached the end of the path, destroy it and reduce the total health
            else{
                this.scene.totalHealth -= this.health
                this.destroy()
                
            }
        }
        // if the enemy's health is less than or equal to 0, destroy it and give money
        else{
            money += Math.round(baseMoney *0.5 * moneyMultiplier)
            baseMoney *= growthRate
            this.destroy()
        }
    }


}

// This is the main scene of the game, where the game logic is handled
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' })
        
    }
    // Preload the assets for the game
    preload() {
        console.log("preload")
        this.load.image("drone", "Drone.png")
        this.load.image("bow", "Sci-Fi Bow.png")
        this.load.image("bullet", "Bullet.png")
        this.load.image("range", "Range.png")
        this.load.image("RangeBtn", "RangeButton.png")
    }

    // Create the game objects and set up the game logic
    create() {
        
        let alreadyMenu = false
        this.totalHealth = 100000
        money = 1000
        moneyMultiplier = Phaser.Math.Between(66, 133)/100
        inventory = []
        bowInventory = []


        this.totalHealthText = this.add.text(20, 40, this.totalHealth)
        this.bowImage = this.add.image(700, 600 , "bow").setScale(.24)
        this.bowInventoryText = this.add.text(721, 555, bowInventory.length, { fontSize: '20px', fill: '0x000000', fontFamily: "Arial", fontWeight: "bold"})
        const menuText = this.add.text(1050, 30, 'Menu', { fontSize: '32px', fill: '#0f0', fontFamily: "Arial"}).setOrigin(0.5, 0.5).setInteractive()
        
        // make the menu text start and pause the mainscene
        menuText.on('pointerdown', ()=>{
            this.scene.pause("MainScene")
            this.scene.setVisible(false, "MainScene")
            if (!alreadyMenu){
                this.scene.launch("MenuScene")
                alreadyMenu = true
            }
            else{
                this.scene.resume("MenuScene")
                this.scene.setVisible(true, "MenuScene")
            }

        })


        this.paused = false
        console.log("create")
        // Draw the path for the enemies
        this.drawPath()
        
        this.moneyText = this.add.text(20, 20, money.toFixed(2))
        const baseRadius = 100
        const rangeKey = 'rangeCircle'

        // Create a texture for the range circle if it doesn't exist
        if (!this.textures.exists(rangeKey)) {
            const g = this.make.graphics({x: 0, y: 0, add: false});
            g.fillStyle(0x57B9FF, 0.3);
            g.fillCircle(baseRadius, baseRadius, baseRadius);
            g.generateTexture(rangeKey, baseRadius * 2, baseRadius * 2);
            g.destroy();
}
        this.bows = []


        // whole event for placing a bow
        this.input.on("pointerdown", (pointer) => {
            //
            const canvas = this.sys.game.canvas
            const ctx = canvas.getContext('2d')
            const imageData = ctx.getImageData(pointer.x, pointer.y, 1, 1).data

            // Check if the clicked position is on a white pixel and if it is dont place a bow
            if (imageData[0] === 255 && imageData[1] === 255 && imageData[2] === 255 && imageData[3] > 0){
            }
            // If the clicked position is not on a white pixel, place a bow
            else{                            
                let place = true

                // Check if the clicked position is too close to other bows
                for (let closeToTower of this.bows){
                    const directionx = closeToTower.x - pointer.x
                    const directiony = closeToTower.y - pointer.y

                    const distance = Math.sqrt(directionx * directionx + directiony * directiony)
                    if (distance < 30){
                        place = false
                        break
                    }
                }

                // Check if the clicked position is too close to the menu
                const menuDistX =  pointer.x - 1050
                const menuDistY = pointer.y - 30
                const menuDistance = Math.sqrt(menuDistX * menuDistX + menuDistY * menuDistY)
                if (menuDistance < 50){
                    place = false
                }
                
                // If no bow is in the inventory, don't place a bow
                if (!inventory.includes("bow")){
                    place = false
                    
                }

                //  If the clicked position is valid, place a bow
                if (place){
                    const bowInvertoryIndex = inventory.indexOf("bow")
                    
                    // Remove the bow from the inventory and bowInventory
                    if (bowInvertoryIndex !== -1) {
                        inventory.splice(bowInvertoryIndex, 1)
                    }
                    const bowInventoryIndex = bowInventory.indexOf("bow")
                    if (bowInventoryIndex !== -1) {
                        bowInventory.splice(bowInventoryIndex, 1)
                    }

                // Create a new bow at the clicked position
                // The bow has a range of 200 and an attack speed of 300
                    const newBow = new Tower(this, pointer.x, pointer.y, 200, 300)
                this.bows.push(newBow)

                // If the mouse is over the bow, show the range circle, and pause the game
                newBow.on('pointerover', () => {
                    if (!newBow.rangeSprite){
                        newBow.rangeSprite = this.add.image(newBow.x, newBow.y, rangeKey)
                        // Scale so the displayed radius matches newBow.range
                        const scale = newBow.range / baseRadius
                        newBow.rangeSprite.setScale(scale)
                        newBow.rangeSprite.setDepth(-1)

                        
                    }
                    
                    this.paused = true
                    for (let bow of this.bows){
                        bow.bulletTimer.paused = true
                    }
                    this.enemyTimer.paused = true
                    
                })

                // If the mouse is not over the bow, hide the range circle, and resume the game
                newBow.on('pointerout', () => {
                    this.scene.resume()
                    if (newBow.rangeSprite){
                        
                        console.log("offbow")
                        newBow.rangeSprite.destroy()
                        newBow.rangeSprite = null
                        
                    }
                    if (this.rangeBtn){
                        this.rangeBtn.destroy()
                        this.rangeBtn = null
                    }
                    this.paused = false
                    for (let bow of this.bows){
                        bow.bulletTimer.paused= false
                    }
                    
                    this.enemyTimer.paused = false
                })
            
                // spawn bullets based on the attack speed
                newBow.bulletTimer = this.time.addEvent({
                delay: newBow.attackSpeed,
                loop: true,
                callback: () => {
                const closest = newBow.aimAtClosestEnemy(this.amountOfEnimies)
                if (closest) {
                    const bullet = new Bullet(this, newBow.x, newBow.y, 20, 5, newBow.range)
                    bullet.target = closest
                    this.bullets.push(bullet)
                }
                }
                })
                }







                
            }
            })

        // spawn enemies, have the time between waves increase until a certain point, then stop increasing
        this.amountOfEnimies= []
        this.wave = 1
        this.delay = 1
        this.decay = 20
        this.increment = 350
        this.decayDecay = 0.99999
        this.enemyTimer = this.time.addEvent({
            delay: this.delay,
            loop: true,
            callback: () =>{
                console.log("wave " + this.wave)
                
                for (let i = 0; i < this.wave; i++){
                    

                    
                    this.spawnEnemy(i*40)
                    this.delay = Math.min(100000, this.delay + this.increment)
                    
                }
                this.increment -= this.decay
                this.decay *= this.decayDecay
                console.log("delay: " + this.delay)
                this.enemyTimer.delay = this.delay
                if (this.delay >= 20000){
                    this.increment = 0
                    this.decay = 0
                    
                }
                
                this.wave++
            }
        })
        this.bullets = []
    }


    update() {
        // if the total health is less than or equal to 0, go to the death scene
        if (this.totalHealth <=0){
            this.scene.start("DeathScene")
        }

        // if the game is paused, don't update anything
        if (this.paused) return

        // update the total health text, bow inventory text, and money text
        this.totalHealthText.setText(this.totalHealth)
        this.bowInventoryText.setText(bowInventory.length)
        this.moneyText.setText(money.toFixed(2))
        moneyMultiplier = Phaser.Math.Between(66, 133)/100

        
        // move the enemies along the path and check their health
        // if the enemy's health is less than 66% or 33%, give money
        for (let i = 0; i < this.amountOfEnimies.length; i++){
            
            this.amountOfEnimies[i].moveAlongPath(this.pathPoints, .8)  
            if (this.amountOfEnimies[i].health < this.amountOfEnimies[i].fullHealth *.66 && !this.amountOfEnimies[i].sixtysixPercent){
                money += Math.round(baseMoney * 0.2 * moneyMultiplier)
                this.amountOfEnimies[i].sixtysixPercent = true
            }
            if (this.amountOfEnimies[i].health < this.amountOfEnimies[i].fullHealth *.33 && !this.amountOfEnimies[i].thirtythreePercent){
                money += Math.round(baseMoney * 0.3 * moneyMultiplier)
                this.amountOfEnimies[i].thirtythreePercent = true
            }
            
            if (this.amountOfEnimies[i].healthText){
                this.amountOfEnimies[i].healthText.setPosition(this.amountOfEnimies[i].x, this.amountOfEnimies[i].y)
                this.amountOfEnimies[i].healthText.setText(this.amountOfEnimies[i].health)
                if (this.amountOfEnimies[i].health <= 0){
                    this.amountOfEnimies[i].healthText.destroy()
                }
            }
        }

        // filter out the enemies that are not active anymore
        this.amountOfEnimies = this.amountOfEnimies.filter(enemy => enemy.active)
        
        // make the bows aim at the closest enemy and update their range sprites
        for (let bow of this.bows) {
            bow.aimAtClosestEnemy(this.amountOfEnimies)
            if (bow.rangeSprite) {
                bow.rangeSprite.setScale(bow.range / baseRadius)
            }
            
            
        }
        

        // make the bullets shoot at the closest enemy
        for (let bullet of this.bullets){
            bullet.shootAtEnemy(bullet.target)

        }
        this.bullets = this.bullets.filter(bullet => bullet.active)
        
    }

    // Spawn an enemy at a certain offset from the start of the path, so they arebt overlapping
    // The health of the enemy is based on the offset, so enemies that spawn later have more health
    spawnEnemy(offset) {
        const iteration = offset / 40
        const health = Math.round(30 * Math.pow(iteration, 1.2) * Math.pow(1.02, iteration))
        
        const enemy = new Enemy(this, this.pathPoints[0].x-offset, this.pathPoints[0].y, health);
                enemy.on('pointerover', () => {
                    if (!enemy.healthText){
                        enemy.healthText = this.add.text(enemy.x, enemy.y, enemy.health, {
                            fontSize: "50px",
                            fill: "#000000"
                        })
                    }
                    if (enemy.health <= 1){
                        enemy.healthText.destroy()
                        enemy.healthText = null
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
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    // Draw the bow purchase menu
    // This menu allows the player to buy bows and upgrade their range and attack speed
    drawBow() {
        const buyBowBox = this.add.rectangle(300, 300, 80, 90, 0xffffff).setOrigin(0.5, 0.5).setDepth(1)
        this.add.rectangle(buyBowBox.x, buyBowBox.y, buyBowBox.width+4, buyBowBox.height+4, 0x000000)
        const buyBow = this.add.text(buyBowBox.x, buyBowBox.y+17, 'Buy', { fontSize: '20px', fill: '#0f0', fontFamily: "Arial" }).setOrigin(0.5, 0.5).setInteractive().setDepth(2)
        this.add.image(buyBowBox.x, buyBowBox.y-15, "bow").setScale(.1).setDepth(2).setOrigin(0.5, 0.5)
        this.bowInventoryText =this.add.text(buyBowBox.x+30, buyBowBox.y-35, bowInventory.length, { fontSize: '15px', fill: '0x000000', fontFamily: "Arial" }).setOrigin(0.5, 0.5).setDepth(2)
        this.bowPriceText = this.add.text(buyBowBox.x, buyBow.y+17, this.bowPrice, { fontSize: '20px', fill: '#0f0', fontFamily: "Arial" }).setOrigin(0.5, 0.5).setDepth(2)


        buyBow.on("pointerdown", () => {
            if (money >= this.bowPrice){
                inventory.push("bow")
                bowInventory.push("bow")
                money -= this.bowPrice
                this.bowPrice *= 1 + .3 / Math.sqrt(this.bowPriceIteration)
                this.bowPriceIteration += 1
                this.bowPriceText.setText(this.bowPrice.toFixed(2))
            }
            
        })
        
        this.rangeBtn = this.add.image(buyBow.x-5, buyBow.y+30, "RangeBtn").setScale(.4).setInteractive().setOrigin(1, 0)
        this.rangePriceText = this.add.text(this.rangeBtn.x-60, this.rangeBtn.y+17, this.rangePrice, { fontSize: '20px', fill: '#0f0', fontFamily: "Arial" }).setDepth(2)
        this.rangeBtn.on("pointerdown", () => {
            const mainScene = this.scene.get("MainScene")
            if (money > this.rangePrice){
                for (let bow of mainScene.bows){
                    bow.upgradeRange(10)
                    
                }
                money -= this.rangePrice
                this.rangePrice *= 1 + .3 / Math.sqrt(this.rangePriceIteration)
                this.rangePriceIteration += 1
                this.rangePriceText.setText(this.rangePrice.toFixed(2))
            }
        })

        this.attackSpeedBtn = this.add.image(buyBow.x+5, buyBow.y+30, "attackSpeedBtn").setScale(.4).setInteractive().setOrigin(0, 0)
        this.attackSpeedPriceText = this.add.text(this.attackSpeedBtn.x+28, this.attackSpeedBtn.y+17, this.speedPrice, { fontSize: '20px', fill: '#0f0', fontFamily: "Arial" }).setDepth(2)
        this.attackSpeedBtn.on("pointerdown", () => {
            const mainScene = this.scene.get("MainScene")
            if (money > this.speedPrice){
                for (let bow of mainScene.bows){
                    bow.upgradeAttackSpeed(2)
                    
                }
                money -= this.speedPrice
                this.speedPrice *= 1 + .3 / Math.sqrt(this.speedPriceIteration)
                this.speedPriceIteration += 1
                this.attackSpeedPriceText.setText(this.speedPrice.toFixed(2))
            }
        })

    
    }

    preload(){
        this.load.image("drone", "Drone.png")
        this.load.image("bow", "Sci-Fi Bow.png")
        this.load.image("bullet", "Bullet.png")
        this.load.image("range", "Range.png")
        this.load.image("attackSpeedBtn", "AttackSpeedButton.png")
        this.load.image("damageBtn", "DamageButton.png")
    }
    create(){
        this.bowPrice = 100
        this.bowPriceIteration = 1
        this.speedPrice = 100
        this.speedPriceIteration = 1
        this.rangePrice = 100
        this.rangePriceIteration = 1

        // Create the menu background and text
        this.moneyText = this.add.text(20, 20, money)
        const background = this.add.rectangle(550, 325, 1100, 650, 0x006400).setOrigin(0.5, 0.5).setDepth(-1)
        const gameText = this.add.text(1050, 30, 'Game', { fontSize: '32px', fill: '#0f0', fontFamily: "Arial" }).setOrigin(0.5, 0.5).setInteractive()
        
        // Make the game text start and pause the mainscene
        gameText.on("pointerdown", () => {
            this.scene.setVisible(false, "MenuScene")
            this.scene.bringToTop("MainScene")
            this.scene.pause()
            this.scene.resume("MainScene")
            this.scene.setVisible(true, "MainScene")
        })

        // Create the menu background and text
        this.drawBow()
        

        
    }

    update(){

        if (this.bowInventoryText){
            // update the bow inventory text
            this.bowInventoryText.setText(bowInventory.length)
        }

        // update the money text
        this.moneyText.setText(money)
        
        
    }





}

class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathScene' });
    }
    preload(){

    }
    create(){
        // Create the game over text and restart button
        this.add.text(100, 100, 'Game Over', { fontSize: '64px', fill: '#ffffff' })
        this.add.text(100, 200, 'Click to Restart', { fontSize: '32px', fill: '#ffffff' }).setInteractive()
        this.input.on('pointerdown', () => {
            this.scene.stop('MenuScene')
            this.scene.start('MainScene')
        })
    }
    update(){

    }



}







const config = {
    type: Phaser.CANVAS,
    width: 1100,
    height: 650,
    scene: [MainScene, MenuScene, DeathScene],
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