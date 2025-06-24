import Phaser from 'phaser';

// ===== ENHANCED GAME STATE WITH SUSPENSE FEATURES =====
let gameState = {
    money: 1000,
    moneyMultiplier: Phaser.Math.Between(66, 133) / 100,
    wave: 1,
    score: 0,
    lives: 20,
    inventory: [],
    bowInventory: [],
    baseMoney: 300,
    growthRate: 1.01,
    isPaused: false,
    difficulty: 'normal', // easy, normal, hard, nightmare
    unlockedTowers: ['bow'],
    achievements: [],
    totalKills: 0,
    totalMoneyEarned: 0,
    
    // NEW SUSPENSE FEATURES
    criticalMode: false,        // Activated when lives < 5
    bossWave: false,            // Special boss wave indicator
    powerUpActive: false,       // Temporary power-ups
    comboMultiplier: 1,         // Kill combo system
    lastKillTime: 0,            // For combo timing
    streakCount: 0,             // Current kill streak
    maxStreak: 0,               // Best kill streak
    specialEvents: [],          // Active special events
    unlockedSecrets: [],        // Hidden features
    playtime: 0,                // Total play time
    waveProgress: 0,            // Current wave completion %
    nextWaveCountdown: 0,       // Time until next wave
    bossesKilled: 0,            // Boss kill counter
    
    // DYNAMIC DIFFICULTY
    adaptiveDifficulty: true,
    playerSkillLevel: 1,        // Auto-adjusts based on performance
    recentPerformance: [],      // Track last 5 waves
    
    // ACHIEVEMENT PROGRESS
    killsThisWave: 0,
    perfectWaves: 0,            // Waves with no life lost
    fastestWave: Infinity,      // Best wave completion time
    moneySpentOnUpgrades: 0,
    towersBuilt: 0,
    
    // VISUAL ENHANCEMENTS
    screenShakeIntensity: 1,
    particleQuality: 'high',    // high, medium, low
    soundEnabled: true,
    musicEnabled: true,
    
    // SAVE SYSTEM
    gameVersion: '2.0',
    lastSaved: null,
    autoSave: true
}

// ===== SAVE/LOAD SYSTEM =====
class SaveManager {
    static save() {
        try {
            const saveData = {
                ...gameState,
                lastSaved: Date.now()
            }
            localStorage.setItem('towerDefenseSave', JSON.stringify(saveData))
            return true
        } catch (e) {
            console.error('Failed to save game:', e)
            return false
        }
    }
    
    static load() {
        try {
            const saveData = localStorage.getItem('towerDefenseSave')
            if (saveData) {
                const parsed = JSON.parse(saveData)
                Object.assign(gameState, parsed)
                return true
            }
        } catch (e) {
            console.error('Failed to load game:', e)
        }
        return false
    }
    
    static clearSave() {
        localStorage.removeItem('towerDefenseSave')
    }
    
    static hasSave() {
        return localStorage.getItem('towerDefenseSave') !== null
    }
}

// ===== ENHANCED SOUND MANAGER WITH DYNAMIC AUDIO =====
class SoundManager {
    constructor(scene) {
        this.scene = scene
        this.sounds = {}
        this.musicVolume = 0.5
        this.sfxVolume = 0.7
        this.currentMusic = null
        this.musicIntensity = 1 // Changes based on game state
    }

    loadSounds() {
        if (!gameState.soundEnabled) return
        
        // Combat sounds with intensity variations
        this.createSound('shoot', [200, 0.1])
        this.createSound('shootHeavy', [150, 0.15])
        this.createSound('shootLaser', [800, 0.05])
        this.createSound('shootIce', [300, 0.2])
        this.createSound('shootPoison', [100, 0.3])
        
        // Impact and feedback
        this.createSound('hit', [150, 0.15])
        this.createSound('criticalHit', [400, 0.1])
        this.createSound('enemyDeath', [100, 0.2])
        this.createSound('enemyDeathBoss', [50, 0.5])
        
        // UI and system sounds
        this.createSound('towerPlace', [300, 0.1])
        this.createSound('towerSell', [200, 0.2])
        this.createSound('upgrade', [400, 0.15])
        this.createSound('upgradeMax', [500, 0.3])
        this.createSound('moneyEarn', [600, 0.1])
        this.createSound('achievement', [700, 0.4])
        
        // Atmosphere and tension
        this.createSound('waveStart', [250, 0.3])
        this.createSound('waveComplete', [350, 0.4])
        this.createSound('bossWarning', [80, 1.0])
        this.createSound('criticalMode', [60, 0.8])
        this.createSound('gameOver', [80, 0.5])
        this.createSound('victory', [500, 1.0])
        
        // Combo and special effects
        this.createSound('combo2', [300, 0.1])
        this.createSound('combo5', [350, 0.2])
        this.createSound('combo10', [400, 0.3])
        this.createSound('powerUp', [600, 0.5])
    }

    createSound(name, [freq, duration]) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            this.sounds[name] = (intensity = 1) => {
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                
                oscillator.frequency.value = freq * intensity
                const volume = this.sfxVolume * 0.1 * intensity
                gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
                
                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + duration)
            }
        } catch (e) {
            this.sounds[name] = () => console.log(`Sound: ${name}`)
        }
    }

    play(soundName, intensity = 1) {
        if (!gameState.soundEnabled || !this.sounds[soundName]) return
        
        try {
            // Add slight randomization for variety
            const randomIntensity = intensity * Phaser.Math.FloatBetween(0.9, 1.1)
            this.sounds[soundName](randomIntensity)
        } catch (e) {
            console.log('Audio playback failed:', soundName)
        }
    }

    playComboSound(comboCount) {
        if (comboCount >= 10) this.play('combo10', 1.2)
        else if (comboCount >= 5) this.play('combo5', 1.1)
        else if (comboCount >= 2) this.play('combo2', 1.0)
    }

    updateMusicIntensity() {
        // Dynamic music based on game state
        let newIntensity = 1
        
        if (gameState.criticalMode) newIntensity = 1.5
        if (gameState.bossWave) newIntensity = 1.3
        if (gameState.comboMultiplier > 2) newIntensity = 1.2
        
        this.musicIntensity = newIntensity
    }
}

// ===== ENHANCED PARTICLE SYSTEM WITH CINEMATIC EFFECTS =====
class ParticleSystem {
    constructor(scene) {
        this.scene = scene
        this.particles = []
        this.screenShakeIntensity = gameState.screenShakeIntensity
    }

    createExplosion(x, y, color = 0xff0000, size = 'normal') {
        const particleCount = size === 'large' ? 16 : size === 'small' ? 4 : 8
        const maxSpeed = size === 'large' ? 150 : size === 'small' ? 75 : 100
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.scene.add.circle(x, y, 
                size === 'large' ? 5 : size === 'small' ? 2 : 3, 
                color)
            const angle = (i / particleCount) * Math.PI * 2
            const speed = Phaser.Math.Between(50, maxSpeed)
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: size === 'large' ? 800 : 500,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            })
        }
        
        // Screen shake for large explosions
        if (size === 'large') {
            this.scene.cameras.main.shake(300, 0.02 * this.screenShakeIntensity)
        }
    }

    createDamageText(x, y, damage, color = '#ff0000') {
        const isCrit = damage > 10
        const text = this.scene.add.text(x, y, 
            isCrit ? `CRIT! -${damage}` : `-${damage}`, {
            fontSize: isCrit ? '20px' : '16px',
            fill: color,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5)

        this.scene.tweens.add({
            targets: text,
            y: y - (isCrit ? 50 : 30),
            alpha: 0,
            scale: isCrit ? 1.5 : 1,
            duration: isCrit ? 1200 : 800,
            ease: 'Power2',
            onComplete: () => text.destroy()
        })
    }

    createMoneyText(x, y, amount) {
        const text = this.scene.add.text(x, y, `+$${amount}`, {
            fontSize: '14px',
            fill: '#00ff00',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5)

        this.scene.tweens.add({
            targets: text,
            y: y - 40,
            x: x + Phaser.Math.Between(-20, 20),
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        })
    }

    createComboText(x, y, comboCount) {
        const text = this.scene.add.text(x, y, `${comboCount}x COMBO!`, {
            fontSize: `${16 + comboCount * 2}px`,
            fill: '#ffff00',
            fontWeight: 'bold',
            stroke: '#ff0000',
            strokeThickness: 3
        }).setOrigin(0.5)

        this.scene.tweens.add({
            targets: text,
            y: y - 60,
            scale: 1.5,
            alpha: 0,
            duration: 1500,
            ease: 'Elastic',
            onComplete: () => text.destroy()
        })
    }

    createLevelUpEffect(x, y) {
        // Golden spiral effect
        for (let i = 0; i < 12; i++) {
            const angle = i * 30
            const particle = this.scene.add.circle(x, y, 4, 0xffd700)
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 80,
                y: y + Math.sin(angle) * 80,
                alpha: 0,
                scale: 2,
                duration: 1000,
                delay: i * 50,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            })
        }
    }

    createWaveStartEffect() {
        const centerX = this.scene.cameras.main.centerX
        const centerY = this.scene.cameras.main.centerY
        
        const text = this.scene.add.text(centerX, centerY, `WAVE ${gameState.wave}`, {
            fontSize: '48px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5)

        this.scene.tweens.add({
            targets: text,
            scale: 1.5,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        })
        
        // Screen flash
        const flash = this.scene.add.rectangle(centerX, centerY, 
            this.scene.cameras.main.width, this.scene.cameras.main.height, 
            0xffffff, 0.3)
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => flash.destroy()
        })
    }

    createBossWarning() {
        const centerX = this.scene.cameras.main.centerX
        const centerY = this.scene.cameras.main.centerY
        
        const warning = this.scene.add.text(centerX, centerY, 'BOSS INCOMING!', {
            fontSize: '64px',
            fill: '#ff0000',
            fontWeight: 'bold',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5)

        // Pulsing effect
        this.scene.tweens.add({
            targets: warning,
            scale: 1.2,
            duration: 300,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: warning,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => warning.destroy()
                })
            }
        })
        
        // Red screen overlay
        const overlay = this.scene.add.rectangle(centerX, centerY,
            this.scene.cameras.main.width, this.scene.cameras.main.height,
            0xff0000, 0.2)
        
        this.scene.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 2000,
            onComplete: () => overlay.destroy()
        })
    }
}

// ===== ENHANCED TOWER CLASS =====
class Tower extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, towerType = 'bow') {
        super(scene, x, y, towerType)
        scene.add.existing(this)
        
        this.towerType = towerType
        this.level = 1
        this.experience = 0
        this.experienceToNext = 100
        
        // Tower stats based on type
        this.initializeStats(towerType)
        
        this.setScale(0.1)
        this.setInteractive()
        this.kills = 0
        this.totalDamageDealt = 0
        this.rangeSprite = null
        this.upgradeMenu = null
        
        // Visual enhancements
        this.levelText = scene.add.text(x, y - 20, this.level, {
            fontSize: '12px',
            fill: '#ffffff',
            backgroundColor: '#000000'
        }).setOrigin(0.5)
        
        this.setupHoverEffects()
    }

    initializeStats(type) {
        const stats = {
            bow: { 
                range: 200, attackSpeed: 300, damage: 5, cost: 100,
                special: 'precision', description: 'High accuracy, reliable damage'
            },
            cannon: { 
                range: 150, attackSpeed: 800, damage: 25, cost: 250,
                special: 'explosive', description: 'Area damage, slow but powerful'
            },
            laser: { 
                range: 300, attackSpeed: 100, damage: 2, cost: 400,
                special: 'chain', description: 'Chain lightning, hits multiple enemies'
            },
            ice: { 
                range: 180, attackSpeed: 400, damage: 3, cost: 200,
                special: 'freeze', description: 'Slows and freezes enemies'
            },
            poison: { 
                range: 160, attackSpeed: 500, damage: 4, cost: 300,
                special: 'dot', description: 'Damage over time, spreads on death'
            },
            // NEW UNIQUE TOWER TYPES FOR SUSPENSE
            lightning: {
                range: 250, attackSpeed: 200, damage: 8, cost: 500,
                special: 'storm', description: 'Calls down lightning strikes'
            },
            plasma: {
                range: 220, attackSpeed: 350, damage: 12, cost: 600,
                special: 'melt', description: 'Melts armor, piercing damage'
            },
            tesla: {
                range: 180, attackSpeed: 250, damage: 6, cost: 450,
                special: 'overcharge', description: 'Powers up nearby towers'
            }
        }
        
        const stat = stats[type] || stats.bow
        this.range = stat.range
        this.attackSpeed = stat.attackSpeed
        this.baseDamage = stat.damage
        this.cost = stat.cost
        this.specialEffect = type
        this.description = stat.description
        this.specialAbility = stat.special
        
        // Advanced tower properties
        this.criticalChance = 0.05 // 5% base crit chance
        this.criticalMultiplier = 2.0
        this.armorPenetration = 0
        this.multishot = 1 // Number of projectiles
        this.bounceCount = 0 // For laser towers
        this.auraRadius = 0 // Support effects
        this.chargeTime = 0 // For special abilities
        this.overchargeLevel = 0 // Tesla tower effect
        
        // Visual enhancements per type
        this.setTowerVisuals(type)
    }

    setTowerVisuals(type) {
        const colors = {
            bow: 0xffffff,
            cannon: 0x8B4513,
            laser: 0x00ff00,
            ice: 0x87ceeb,
            poison: 0x9400d3,
            lightning: 0xffff00,
            plasma: 0xff6600,
            tesla: 0x00ffff
        }
        
        this.setTint(colors[type] || 0xffffff)
        
        // Special visual effects
        if (type === 'lightning') {
            this.createLightningAura()
        } else if (type === 'tesla') {
            this.createTeslaField()
        }
    }

    createLightningAura() {
        // Visual lightning effect around tower
        this.lightningTimer = this.scene.time.addEvent({
            delay: 2000 + Math.random() * 3000,
            loop: true,
            callback: () => {
                const spark = this.scene.add.circle(
                    this.x + Phaser.Math.Between(-30, 30),
                    this.y + Phaser.Math.Between(-30, 30),
                    2, 0xffff00
                )
                this.scene.tweens.add({
                    targets: spark,
                    alpha: 0,
                    scale: 3,
                    duration: 300,
                    onComplete: () => spark.destroy()
                })
            }
        })
    }

    createTeslaField() {
        // Pulsing energy field
        this.teslaField = this.scene.add.circle(this.x, this.y, 40, 0x00ffff, 0.1)
        this.teslaField.setDepth(-1)
        
        this.scene.tweens.add({
            targets: this.teslaField,
            scale: 1.2,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        })
    }

    setupHoverEffects() {
        this.on('pointerover', () => this.showUpgradeMenu())
        this.on('pointerout', () => this.hideUpgradeMenu())
    }

    showUpgradeMenu() {
        if (!this.upgradeMenu) {
            this.createUpgradeMenu()
        }
        if (this.rangeSprite) {
            this.rangeSprite.destroy()
        }
        this.showRange()
    }

    hideUpgradeMenu() {
        if (this.upgradeMenu) {
            this.upgradeMenu.destroy()
            this.upgradeMenu = null
        }
        if (this.rangeSprite) {
            this.rangeSprite.destroy()
            this.rangeSprite = null
        }
    }

    createUpgradeMenu() {
        const menuX = this.x + 50
        const menuY = this.y - 50
        
        this.upgradeMenu = this.scene.add.container(menuX, menuY)
        
        // Background
        const bg = this.scene.add.rectangle(0, 0, 120, 80, 0x000000, 0.8)
        this.upgradeMenu.add(bg)
        
        // Upgrade buttons
        const rangeBtn = this.scene.add.text(-50, -25, 'Range\n$50', {
            fontSize: '10px', fill: '#00ff00', backgroundColor: '#004400'
        }).setInteractive()
        
        const speedBtn = this.scene.add.text(-50, 0, 'Speed\n$75', {
            fontSize: '10px', fill: '#ffff00', backgroundColor: '#444400'
        }).setInteractive()
        
        const damageBtn = this.scene.add.text(-50, 25, 'Damage\n$100', {
            fontSize: '10px', fill: '#ff0000', backgroundColor: '#440000'
        }).setInteractive()
        
        rangeBtn.on('pointerdown', () => this.upgrade('range'))
        speedBtn.on('pointerdown', () => this.upgrade('speed'))
        damageBtn.on('pointerdown', () => this.upgrade('damage'))
        
        this.upgradeMenu.add([rangeBtn, speedBtn, damageBtn])
    }

    upgrade(type) {
        const costs = { range: 50, speed: 75, damage: 100 }
        const cost = costs[type] * this.level
        
        if (gameState.money >= cost) {
            gameState.money -= cost
            this.scene.soundManager.play('upgrade')
            
            switch (type) {
                case 'range':
                    this.range = Math.min(400, this.range + 30)
                    break
                case 'speed':
                    this.attackSpeed = Math.max(50, this.attackSpeed - 50)
                    if (this.bulletTimer) {
                        this.bulletTimer.delay = this.attackSpeed
                    }
                    break
                case 'damage':
                    this.baseDamage += 3
                    break
            }
            
            this.gainExperience(25)
            this.hideUpgradeMenu()
        }
    }

    gainExperience(amount) {
        this.experience += amount
        if (this.experience >= this.experienceToNext) {
            this.levelUp()
        }
    }

    levelUp() {
        this.level++
        this.experience = 0
        this.experienceToNext = Math.floor(this.experienceToNext * 1.5)
        
        // Level up bonuses
        this.range += 10
        this.baseDamage += 1
        this.attackSpeed = Math.max(50, this.attackSpeed - 10)
        
        this.levelText.setText(this.level)
        
        // Visual effect
        this.scene.particleSystem.createExplosion(this.x, this.y, 0x00ff00)
    }

    showRange() {
        const rangeKey = 'range'
        const baseRadius = 200 // Base radius of the range image
        
        this.rangeSprite = this.scene.add.image(this.x, this.y, rangeKey)
        const scale = this.range / baseRadius
        this.rangeSprite.setScale(scale)
        this.rangeSprite.setDepth(-1)
        this.rangeSprite.setAlpha(0.3)
    }

    aimAtClosestEnemy(enemies) {
        let closestEnemy = null
        let distanceToEnemy = Infinity

        for (let enemy of enemies) {
            if (enemy.health <= 0) continue
            
            const distanceX = enemy.x - this.x
            const distanceY = enemy.y - this.y
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY) - 12

            if (distance < distanceToEnemy && distance < this.range) {
                closestEnemy = enemy
                distanceToEnemy = distance
            }
        }

        if (closestEnemy) {
            const newRotation = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x)
            this.rotation = Phaser.Math.Linear(this.rotation, newRotation, 0.09)
            return closestEnemy
        }
        return null
    }

    destroy() {
        if (this.levelText) this.levelText.destroy()
        if (this.rangeSprite) this.rangeSprite.destroy()
        if (this.upgradeMenu) this.upgradeMenu.destroy()
        if (this.bulletTimer) this.bulletTimer.destroy()
        super.destroy()
    }
}

// ===== ENHANCED BULLET CLASS =====
class Bullet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, tower, target) {
        super(scene, x, y, "bullet")
        scene.add.existing(this)
        
        this.tower = tower
        this.target = target
        this.damage = tower.baseDamage
        this.bulletSpeed = 15
        this.specialEffect = tower.specialEffect
        this.range = tower.range
        this.traveled = 0
        
        this.setScale(0.5)
        this.setTint(this.getEffectColor())
        
        // Calculate initial direction
        if (target) {
            this.rotation = Math.atan2(target.y - this.y, target.x - this.x)
        }
    }

    getEffectColor() {
        const colors = {
            bow: 0xffffff,
            cannon: 0xff4444,
            laser: 0x44ff44,
            ice: 0x4444ff,
            poison: 0x884488
        }
        return colors[this.specialEffect] || 0xffffff
    }

    update() {
        if (!this.target || this.target.health <= 0) {
            this.destroy()
            return
        }

        const directionX = this.target.x - this.x
        const directionY = this.target.y - this.y
        const distance = Math.sqrt(directionX * directionX + directionY * directionY)

        // Hit target
        if (distance <= 15) {
            this.hitTarget()
            return
        }

        // Out of range
        if (this.traveled > this.range) {
            this.destroy()
            return
        }

        // Move towards target
        this.x += (directionX / distance) * this.bulletSpeed
        this.y += (directionY / distance) * this.bulletSpeed
        this.traveled += this.bulletSpeed

        // Update rotation for visual appeal
        this.rotation = Math.atan2(directionY, directionX)
    }

    hitTarget() {
        if (!this.target || this.target.health <= 0) {
            this.destroy()
            return
        }

        // Apply damage
        const finalDamage = this.calculateDamage()
        this.target.takeDamage(finalDamage)
        
        // Apply special effects
        this.applySpecialEffect()
        
        // Visual and audio feedback
        this.scene.soundManager.play('hit')
        this.scene.particleSystem.createDamageText(this.target.x, this.target.y, finalDamage)
        this.scene.particleSystem.createExplosion(this.x, this.y, this.getEffectColor())
        
        // Update tower stats
        this.tower.totalDamageDealt += finalDamage
        if (this.target.health <= 0) {
            this.tower.kills++
            this.tower.gainExperience(10)
        }
        
        this.destroy()
    }

    calculateDamage() {
        let damage = this.damage
        
        // Critical hit chance (5%)
        if (Math.random() < 0.05) {
            damage *= 2
            this.scene.particleSystem.createDamageText(this.target.x, this.target.y - 20, 'CRIT!', '#ffff00')
        }
        
        return Math.floor(damage)
    }

    applySpecialEffect() {
        if (!this.target) return
        
        switch (this.specialEffect) {
            case 'ice':
                this.target.applyFreeze(2000) // 2 seconds
                break
            case 'poison':
                this.target.applyPoison(3, 1000) // 3 damage over 1 second
                break
            case 'cannon':
                // Splash damage
                this.applySplashDamage(50, this.damage * 0.5)
                break
        }
    }

    applySplashDamage(radius, damage) {
        const enemies = this.scene.amountOfEnemies || []
        for (let enemy of enemies) {
            if (enemy === this.target) continue
            
            const distance = Phaser.Math.Distance.Between(
                this.target.x, this.target.y,
                enemy.x, enemy.y
            )
            
            if (distance <= radius) {
                enemy.takeDamage(damage)
                this.scene.particleSystem.createDamageText(enemy.x, enemy.y, damage, '#ff8800')
            }
        }
    }
}







// ===== ENHANCED ENEMY CLASS =====
class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, enemyType = 'basic') {
        super(scene, x, y, "drone")
        scene.add.existing(this)
        
        this.enemyType = enemyType
        this.initializeStats(enemyType)
        
        this.setScale(0.1)
        this.waypointIndex = 0
        this.statusEffects = {
            frozen: { active: false, timer: 0 },
            poisoned: { active: false, timer: 0, damage: 0 }
        }
        
        // Visual enhancements
        this.healthBar = this.createHealthBar()
        this.statusIcons = []
        
        // Movement
        this.originalSpeed = this.speed
        this.path = this.generatePath()
        this.pathIndex = 0
    }

    initializeStats(type) {
        const stats = {
            basic: { health: 20, speed: 2, reward: 10, armor: 0 },
            fast: { health: 15, speed: 4, reward: 15, armor: 0 },
            tank: { health: 80, speed: 1, reward: 25, armor: 2 },
            flying: { health: 25, speed: 3, reward: 20, armor: 0 },
            boss: { health: 200, speed: 1.5, reward: 100, armor: 5 }
        }
        
        const stat = stats[type] || stats.basic
        this.maxHealth = stat.health * gameState.wave
        this.health = this.maxHealth
        this.speed = stat.speed
        this.reward = stat.reward
        this.armor = stat.armor
        
        // Visual variations
        const colors = {
            basic: 0xffffff,
            fast: 0x00ff00,
            tank: 0x888888,
            flying: 0x00ffff,
            boss: 0xff0000
        }
        this.setTint(colors[type] || 0xffffff)
        
        if (type === 'boss') {
            this.setScale(0.2)
        }
    }

    createHealthBar() {
        const healthBar = this.scene.add.container(this.x, this.y - 15)
        
        const bg = this.scene.add.rectangle(0, 0, 20, 4, 0x000000)
        const fill = this.scene.add.rectangle(-8, 0, 16, 2, 0x00ff00)
        
        healthBar.add([bg, fill])
        healthBar.healthFill = fill
        
        return healthBar
    }

    generatePath() {
        // Generate a more interesting path instead of straight line
        const path = [
            { x: -50, y: 325 },
            { x: 200, y: 325 },
            { x: 200, y: 200 },
            { x: 400, y: 200 },
            { x: 400, y: 450 },
            { x: 600, y: 450 },
            { x: 600, y: 100 },
            { x: 800, y: 100 },
            { x: 800, y: 325 },
            { x: 1200, y: 325 }
        ]
        return path
    }

    update() {
        this.updateMovement()
        this.updateStatusEffects()
        this.updateHealthBar()
        this.updateStatusIcons()
    }

    updateMovement() {
        if (this.statusEffects.frozen.active) {
            return // Can't move when frozen
        }

        if (this.pathIndex >= this.path.length - 1) {
            this.reachEnd()
            return
        }

        const target = this.path[this.pathIndex]
        const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y)

        if (distance < 5) {
            this.pathIndex++
            return
        }

        const direction = Math.atan2(target.y - this.y, target.x - this.x)
        this.x += Math.cos(direction) * this.speed
        this.y += Math.sin(direction) * this.speed
        this.rotation = direction
    }

    updateStatusEffects() {
        // Frozen effect
        if (this.statusEffects.frozen.active) {
            this.statusEffects.frozen.timer -= 16 // Roughly 60 FPS
            if (this.statusEffects.frozen.timer <= 0) {
                this.statusEffects.frozen.active = false
                this.clearTint()
                this.setTint(this.getOriginalColor())
            }
        }

        // Poison effect
        if (this.statusEffects.poisoned.active) {
            this.statusEffects.poisoned.timer -= 16
            if (this.statusEffects.poisoned.timer <= 0) {
                this.takeDamage(this.statusEffects.poisoned.damage, false)
                this.statusEffects.poisoned.timer = 1000 // Reset timer
                
                // Check if poison should end (could add duration)
                if (Math.random() < 0.3) { // 30% chance to end each tick
                    this.statusEffects.poisoned.active = false
                }
            }
        }
    }

    updateHealthBar() {
        if (this.healthBar) {
            this.healthBar.x = this.x
            this.healthBar.y = this.y - 15
            
            const healthPercent = this.health / this.maxHealth
            this.healthBar.healthFill.scaleX = healthPercent
            
            // Color based on health
            if (healthPercent > 0.6) {
                this.healthBar.healthFill.setFillStyle(0x00ff00)
            } else if (healthPercent > 0.3) {
                this.healthBar.healthFill.setFillStyle(0xffff00)
            } else {
                this.healthBar.healthFill.setFillStyle(0xff0000)
            }
        }
    }

    updateStatusIcons() {
        // Clear existing icons
        this.statusIcons.forEach(icon => icon.destroy())
        this.statusIcons = []

        let iconX = this.x - 10
        
        if (this.statusEffects.frozen.active) {
            const icon = this.scene.add.text(iconX, this.y - 25, '❄️', { fontSize: '10px' })
            this.statusIcons.push(icon)
            iconX += 12
        }
        
        if (this.statusEffects.poisoned.active) {
            const icon = this.scene.add.text(iconX, this.y - 25, '☠️', { fontSize: '10px' })
            this.statusIcons.push(icon)
        }
    }

    takeDamage(damage, showEffect = true) {
        // Apply armor reduction
        const finalDamage = Math.max(1, damage - this.armor)
        this.health -= finalDamage
        
        if (showEffect) {
            // Flash effect
            this.setTint(0xff0000)
            this.scene.time.delayedCall(100, () => {
                this.clearTint()
                this.setTint(this.getOriginalColor())
            })
        }

        if (this.health <= 0) {
            this.die()
        }
    }

    applyFreeze(duration) {
        this.statusEffects.frozen.active = true
        this.statusEffects.frozen.timer = duration
        this.setTint(0x4444ff) // Blue tint for frozen
    }

    applyPoison(damage, duration) {
        this.statusEffects.poisoned.active = true
        this.statusEffects.poisoned.damage = damage
        this.statusEffects.poisoned.timer = duration
        this.setTint(0x884488) // Purple tint for poison
    }

    getOriginalColor() {
        const colors = {
            basic: 0xffffff,
            fast: 0x00ff00,
            tank: 0x888888,
            flying: 0x00ffff,
            boss: 0xff0000
        }
        return colors[this.enemyType] || 0xffffff
    }

    reachEnd() {
        gameState.lives--
        this.scene.soundManager.play('gameOver')
        
        // Screen shake effect
        this.scene.cameras.main.shake(200, 0.01)
        
        this.destroy()
    }

    die() {
        // Update combo system
        gameState.lastKillTime = Date.now()
        gameState.streakCount++
        gameState.killsThisWave++
        if (gameState.streakCount > gameState.maxStreak) {
            gameState.maxStreak = gameState.streakCount
        }

        // Calculate combo multiplier
        if (gameState.streakCount >= 10) {
            gameState.comboMultiplier = 3
        } else if (gameState.streakCount >= 5) {
            gameState.comboMultiplier = 2
        } else if (gameState.streakCount >= 2) {
            gameState.comboMultiplier = 1.5
        }

        // Rewards with combo multiplier
        const baseReward = Math.floor(this.reward * gameState.moneyMultiplier)
        const comboReward = Math.floor(baseReward * gameState.comboMultiplier)
        gameState.money += comboReward
        gameState.score += this.reward * 10 * gameState.comboMultiplier
        gameState.totalKills++
        gameState.totalMoneyEarned += comboReward

        // Sound and visual effects
        this.scene.soundManager.play(this.enemyType === 'boss' ? 'enemyDeathBoss' : 'enemyDeath')
        this.scene.soundManager.playComboSound(gameState.streakCount)
        
        // Particle effects
        const explosionSize = this.enemyType === 'boss' ? 'large' : 'normal'
        this.scene.particleSystem.createExplosion(this.x, this.y, this.getOriginalColor(), explosionSize)
        this.scene.particleSystem.createMoneyText(this.x, this.y, comboReward)
        
        if (gameState.comboMultiplier > 1) {
            this.scene.particleSystem.createComboText(this.x, this.y - 30, gameState.streakCount)
        }

        // Achievement checks
        this.checkAchievements()

        this.destroy()
    }

    checkAchievements() {
        // First Blood - 100 kills
        if (gameState.totalKills === 100 && !gameState.achievements.includes('firstBlood')) {
            gameState.achievements.push('firstBlood')
            this.scene.showAchievement('First Blood', '100 enemies defeated!')
        }
        
        // Money Maker - $10,000 total earned
        if (gameState.totalMoneyEarned >= 10000 && !gameState.achievements.includes('moneyMaker')) {
            gameState.achievements.push('moneyMaker')
            this.scene.showAchievement('Money Maker', '$10,000 total earned!')
        }
        
        // Wave Master - Reach wave 20
        if (gameState.wave >= 20 && !gameState.achievements.includes('waveMaster')) {
            gameState.achievements.push('waveMaster')
            this.scene.showAchievement('Wave Master', 'Survived 20 waves!')
        }
        
        // Tower Lord - Build 50 towers
        if (gameState.towersBuilt >= 50 && !gameState.achievements.includes('towerLord')) {
            gameState.achievements.push('towerLord')
            this.scene.showAchievement('Tower Lord', '50 towers constructed!')
            gameState.moneyMultiplier += 0.1 // Permanent bonus
        }
        
        // Combo Master - 25 kill streak
        if (gameState.streakCount >= 25 && !gameState.achievements.includes('comboMaster')) {
            gameState.achievements.push('comboMaster')
            this.scene.showAchievement('Combo Master', '25 kill streak!')
        }
        
        // Boss Slayer - Kill 10 bosses
        if (this.enemyType === 'boss') {
            gameState.bossesKilled = (gameState.bossesKilled || 0) + 1
            if (gameState.bossesKilled >= 10 && !gameState.achievements.includes('bossSlayer')) {
                gameState.achievements.push('bossSlayer')
                this.scene.showAchievement('Boss Slayer', '10 bosses defeated!')
            }
        }
    }

    destroy() {
        if (this.healthBar) this.healthBar.destroy()
        this.statusIcons.forEach(icon => icon.destroy())
        super.destroy()
    }
}

// ===== MAIN SCENE CLASS =====
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' })
    }

    preload() {
        console.log("preload")
        this.load.image("drone", "Drone.png")
        this.load.image("bow", "Sci-Fi Bow.png")
        this.load.image("bullet", "Bullet.png")
        this.load.image("range", "Range.png")
        this.load.image("RangeBtn", "RangeButton.png")
        this.load.image("attackSpeedBtn", "AttackSpeedButton.png")
        this.load.image("damageBtn", "DamageButton.png")
    }

    create() {
        // Initialize enhanced systems
        this.soundManager = new SoundManager(this)
        this.particleSystem = new ParticleSystem(this)
        this.soundManager.loadSounds()
        
        // Try to load saved game
        if (SaveManager.hasSave()) {
            SaveManager.load()
        }
        
        let alreadyMenu = false
        
        // Update UI references to use gameState
        this.setupUI()
        
        // Initialize game arrays
        this.amountOfEnemies = []
        this.bows = []
        this.bullets = []
        
        // Initialize wave and combat systems
        this.setupWaveSystem()
        this.setupInputHandling()
        
        // Auto-save system
        this.time.addEvent({
            delay: 30000, // Every 30 seconds
            loop: true,
            callback: () => {
                if (gameState.autoSave) {
                    SaveManager.save()
                }
            }
        })
        
        // Keyboard controls
        this.setupKeyboardControls()
    }
    
    setupKeyboardControls() {
        // Pause/Resume with P key
        this.input.keyboard.on('keydown-P', () => {
            if (this.scene.isPaused()) {
                this.scene.resume()
            } else {
                this.scene.pause()
            }
        })
        
        // Quick select tower types
        this.input.keyboard.on('keydown-ONE', () => {
            if (gameState.inventory.includes('bow')) {
                gameState.selectedTowerType = 'bow'
            }
        })
        
        this.input.keyboard.on('keydown-TWO', () => {
            if (gameState.inventory.includes('cannon')) {
                gameState.selectedTowerType = 'cannon'
            }
        })
        
        this.input.keyboard.on('keydown-THREE', () => {
            if (gameState.inventory.includes('laser')) {
                gameState.selectedTowerType = 'laser'
            }
        })
        
        // ESC to open menu
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.pause("MainScene")
            this.scene.setVisible(false, "MainScene")
            this.scene.launch("MenuScene")
        })
    }


    setupUI() {
        // Main UI elements
        this.livesText = this.add.text(20, 40, `Lives: ${gameState.lives}`, { fontSize: '20px', fill: '#ffffff' })
        this.moneyText = this.add.text(20, 20, `Money: $${gameState.money}`, { fontSize: '20px', fill: '#ffffff' })
        this.waveText = this.add.text(20, 60, `Wave: ${gameState.wave}`, { fontSize: '20px', fill: '#ffffff' })
        this.scoreText = this.add.text(20, 80, `Score: ${gameState.score}`, { fontSize: '20px', fill: '#ffffff' })
        
        // Bow inventory display
        this.bowImage = this.add.image(700, 600, "bow").setScale(0.24)
        this.bowInventoryText = this.add.text(721, 555, gameState.bowInventory.length, { 
            fontSize: '20px', fill: '#000000', fontFamily: "Arial", fontWeight: "bold"
        })
        
        // Menu button
        const menuText = this.add.text(1050, 30, 'Menu', { 
            fontSize: '32px', fill: '#0f0', fontFamily: "Arial"
        }).setOrigin(0.5, 0.5).setInteractive()
        
        let alreadyMenu = false
        menuText.on('pointerdown', () => {
            this.scene.pause("MainScene")
            this.scene.setVisible(false, "MainScene")
            if (!alreadyMenu) {
                this.scene.launch("MenuScene")
                alreadyMenu = true
            } else {
                this.scene.resume("MenuScene")
                this.scene.setVisible(true, "MenuScene")
            }
        })
        
        // Critical mode warning (initially hidden)
        this.criticalWarning = this.add.text(this.cameras.main.centerX, 120, 
            'CRITICAL MODE ACTIVATED!', {
            fontSize: '32px', fill: '#ff0000', fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false)
    }

    setupWaveSystem() {
        // Draw the path for enemies
        this.drawPath()
        
        // Enemy spawning system
        this.enemySpawnDelay = 2000
        this.enemiesPerWave = 5
        this.currentWaveEnemies = 0
        this.waveInProgress = false
        
        // Start first wave
        this.startWave()
    }

    setupInputHandling() {
        const baseRadius = 100
        const rangeKey = 'rangeCircle'

        // Create range circle texture
        if (!this.textures.exists(rangeKey)) {
            const g = this.make.graphics({x: 0, y: 0, add: false})
            g.fillStyle(0x57B9FF, 0.3)
            g.fillCircle(baseRadius, baseRadius, baseRadius)
            g.generateTexture(rangeKey, baseRadius * 2, baseRadius * 2)
            g.destroy()
        }

        // Tower placement system
        this.input.on("pointerdown", (pointer) => {
            this.placeTower(pointer)
        })
    }

    placeTower(pointer) {
        // Check if we have towers to place
        if (!gameState.inventory.includes("bow")) {
            return
        }

        // Check canvas collision (for path checking)
        const canvas = this.sys.game.canvas
        const ctx = canvas.getContext('2d')
        const imageData = ctx.getImageData(pointer.x, pointer.y, 1, 1).data

        // Don't place on white pixels (path)
        if (imageData[0] === 255 && imageData[1] === 255 && imageData[2] === 255 && imageData[3] > 0) {
            return
        }

        // Check distance from other towers
        let canPlace = true
        for (let tower of this.bows) {
            const distance = Phaser.Math.Distance.Between(tower.x, tower.y, pointer.x, pointer.y)
            if (distance < 30) {
                canPlace = false
                break
            }
        }

        // Check distance from menu
        const menuDistance = Phaser.Math.Distance.Between(pointer.x, pointer.y, 1050, 30)
        if (menuDistance < 50) {
            canPlace = false
        }

        if (canPlace) {
            // Remove from inventory
            const bowIndex = gameState.inventory.indexOf("bow")
            if (bowIndex !== -1) {
                gameState.inventory.splice(bowIndex, 1)
                gameState.bowInventory.splice(gameState.bowInventory.indexOf("bow"), 1)
            }

            // Create new tower (using enhanced Tower class)
            const newTower = new Tower(this, pointer.x, pointer.y, 'bow')
            this.bows.push(newTower)
            gameState.towersBuilt++

            // Setup tower shooting
            newTower.bulletTimer = this.time.addEvent({
                delay: newTower.attackSpeed,
                loop: true,
                callback: () => {
                    const target = newTower.aimAtClosestEnemy(this.amountOfEnemies)
                    if (target) {
                        const bullet = new Bullet(this, newTower.x, newTower.y, newTower, target)
                        this.bullets.push(bullet)
                        this.soundManager.play('shoot')
                    }
                }
            })

            this.soundManager.play('towerPlace')
        }
    }

    startWave() {
        this.waveInProgress = true
        this.currentWaveEnemies = 0
        this.enemiesThisWave = Math.floor(5 + gameState.wave * 1.5)
        
        // Check for boss wave
        if (gameState.wave % 5 === 0) {
            gameState.bossWave = true
            this.particleSystem.createBossWarning()
            this.soundManager.play('bossWarning')
        }
        
        // Wave start effects
        this.particleSystem.createWaveStartEffect()
        this.soundManager.play('waveStart')
        
        // Spawn enemies with intervals
        this.enemySpawnTimer = this.time.addEvent({
            delay: this.enemySpawnDelay,
            repeat: this.enemiesThisWave - 1,
            callback: () => {
                this.spawnEnemy()
                this.currentWaveEnemies++
            }
        })
    }

    spawnEnemy() {
        let enemyType = 'basic'
        
        // Determine enemy type based on wave and randomness
        if (gameState.bossWave && this.currentWaveEnemies === this.enemiesThisWave - 1) {
            enemyType = 'boss'
        } else if (gameState.wave > 10 && Math.random() < 0.2) {
            enemyType = 'tank'
        } else if (gameState.wave > 5 && Math.random() < 0.3) {
            enemyType = 'fast'
        } else if (gameState.wave > 15 && Math.random() < 0.15) {
            enemyType = 'flying'
        }
        
        const enemy = new Enemy(this, this.pathPoints[0].x - 50, this.pathPoints[0].y, enemyType)
        
        // Add hover effects for enemy health display
        enemy.on('pointerover', () => {
            if (!enemy.healthText) {
                enemy.healthText = this.add.text(enemy.x, enemy.y - 30, `${enemy.health}/${enemy.maxHealth}`, {
                    fontSize: "16px",
                    fill: "#ffffff",
                    backgroundColor: "#000000"
                }).setOrigin(0.5)
            }
        })
        
        enemy.on('pointerout', () => {
            if (enemy.healthText) {
                enemy.healthText.destroy()
                enemy.healthText = null
            }
        })
        
        this.amountOfEnemies.push(enemy)
    }

    update() {
        // Game over check
        if (gameState.lives <= 0) {
            this.scene.start("DeathScene")
            return
        }

        // Update playtime
        gameState.playtime += this.game.loop.delta

        // Update UI
        this.updateUI()
        
        // Update critical mode
        this.updateCriticalMode()
        
        // Update enemies
        this.updateEnemies()
        
        // Update towers
        this.updateTowers()
        
        // Update bullets
        this.updateBullets()
        
        // Check wave completion
        this.checkWaveCompletion()
        
        // Update combo system
        this.updateComboSystem()
    }

    updateUI() {
        this.livesText.setText(`Lives: ${gameState.lives}`)
        this.moneyText.setText(`Money: $${gameState.money}`)
        this.waveText.setText(`Wave: ${gameState.wave}`)
        this.scoreText.setText(`Score: ${gameState.score}`)
        this.bowInventoryText.setText(gameState.bowInventory.length)
    }

    updateCriticalMode() {
        if (gameState.lives <= 5 && !gameState.criticalMode) {
            gameState.criticalMode = true
            this.criticalWarning.setVisible(true)
            this.soundManager.play('criticalMode')
            
            // Screen effects
            this.cameras.main.shake(500, 0.01)
            
            // Pulsing warning text
            this.tweens.add({
                targets: this.criticalWarning,
                alpha: 0.3,
                duration: 500,
                yoyo: true,
                repeat: -1
            })
        } else if (gameState.lives > 5 && gameState.criticalMode) {
            gameState.criticalMode = false
            this.criticalWarning.setVisible(false)
        }
    }

    updateEnemies() {
        for (let i = this.amountOfEnemies.length - 1; i >= 0; i--) {
            const enemy = this.amountOfEnemies[i]
            enemy.update()
            
            // Update health text position
            if (enemy.healthText) {
                enemy.healthText.setPosition(enemy.x, enemy.y - 30)
                enemy.healthText.setText(`${enemy.health}/${enemy.maxHealth}`)
                if (enemy.health <= 0) {
                    enemy.healthText.destroy()
                }
            }
            
            // Remove dead/inactive enemies
            if (!enemy.active || enemy.health <= 0) {
                this.amountOfEnemies.splice(i, 1)
            }
        }
    }

    updateTowers() {
        for (let tower of this.bows) {
            tower.aimAtClosestEnemy(this.amountOfEnemies)
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i]
            bullet.update()
            
            if (!bullet.active) {
                this.bullets.splice(i, 1)
            }
        }
    }

    updateComboSystem() {
        // Combo timeout check
        if (Date.now() - gameState.lastKillTime > 3000) { // 3 second timeout
            if (gameState.streakCount > 0) {
                gameState.streakCount = 0
                gameState.comboMultiplier = 1
            }
        }
    }

    checkWaveCompletion() {
        if (this.waveInProgress && this.amountOfEnemies.length === 0 && this.currentWaveEnemies >= this.enemiesThisWave) {
            this.completeWave()
        }
    }

    completeWave() {
        this.waveInProgress = false
        gameState.bossWave = false
        gameState.wave++
        
        // Wave completion rewards
        const waveBonus = gameState.wave * 50
        gameState.money += waveBonus
        gameState.score += waveBonus * 2
        
        // Check for perfect wave
        if (gameState.killsThisWave > 0 && gameState.lives === 20) {
            gameState.perfectWaves++
        }
        gameState.killsThisWave = 0
        
        // Sound and visual effects
        this.soundManager.play('waveComplete')
        this.particleSystem.createMoneyText(this.cameras.main.centerX, this.cameras.main.centerY, waveBonus)
        
        // Start next wave after delay
        this.time.delayedCall(3000, () => {
            this.startWave()
        })
        
        // Auto-save after each wave
        SaveManager.save()
    }

    showAchievement(title, description) {
        const achievementText = this.add.text(this.cameras.main.centerX, 200, 
            `${title}\n${description}`, {
            fontSize: '24px',
            fill: '#ffff00',
            align: 'center',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)

        this.soundManager.play('achievement')
        
        this.tweens.add({
            targets: achievementText,
            y: 150,
            alpha: 0,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => achievementText.destroy()
        })
    }

    drawPath() {
        // Create the path graphics
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

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' })
    }
    
    preload() {
        this.load.image("drone", "Drone.png")
        this.load.image("bow", "Sci-Fi Bow.png")
        this.load.image("bullet", "Bullet.png")
        this.load.image("range", "Range.png")
        this.load.image("attackSpeedBtn", "AttackSpeedButton.png")
        this.load.image("damageBtn", "DamageButton.png")
    }

    create() {
        this.bowPrice = 100
        this.bowPriceIteration = 1
        this.speedPrice = 100
        this.speedPriceIteration = 1
        this.rangePrice = 100
        this.rangePriceIteration = 1

        // Create the menu background and text
        this.moneyText = this.add.text(20, 20, `Money: $${gameState.money}`, { fontSize: '20px', fill: '#ffffff' })
        const background = this.add.rectangle(550, 325, 1100, 650, 0x006400).setOrigin(0.5, 0.5).setDepth(-1)
        const gameText = this.add.text(1050, 30, 'Game', { 
            fontSize: '32px', fill: '#0f0', fontFamily: "Arial" 
        }).setOrigin(0.5, 0.5).setInteractive()
        
        // Make the game text resume MainScene
        gameText.on("pointerdown", () => {
            this.scene.setVisible(false, "MenuScene")
            this.scene.bringToTop("MainScene")
            this.scene.pause()
            this.scene.resume("MainScene")
            this.scene.setVisible(true, "MainScene")
        })

        // Create the shop interface
        this.createShop()
    }

    createShop() {
        // Basic Bow Shop
        this.createTowerShop('bow', 300, 300)
        
        // Advanced tower shops (unlock based on progression)
        if (gameState.wave >= 5) {
            this.createTowerShop('cannon', 450, 300)
        }
        if (gameState.wave >= 10) {
            this.createTowerShop('laser', 600, 300)
        }
        if (gameState.wave >= 15) {
            this.createTowerShop('ice', 300, 450)
        }
        if (gameState.wave >= 20) {
            this.createTowerShop('poison', 450, 450)
        }
        
        // Upgrade buttons
        this.createUpgradeButtons()
    }

    createTowerShop(towerType, x, y) {
        const towerCosts = {
            bow: 100,
            cannon: 250,
            laser: 400,
            ice: 200,
            poison: 300,
            lightning: 500,
            plasma: 600,
            tesla: 450
        }

        const cost = towerCosts[towerType]
        const buyBox = this.add.rectangle(x, y, 80, 90, 0xffffff).setOrigin(0.5, 0.5).setDepth(1)
        this.add.rectangle(x, y, 84, 94, 0x000000).setDepth(0)
        
        const buyBtn = this.add.text(x, y + 17, 'Buy', { 
            fontSize: '16px', fill: '#0f0', fontFamily: "Arial" 
        }).setOrigin(0.5, 0.5).setInteractive().setDepth(2)
        
        this.add.image(x, y - 15, "bow").setScale(0.1).setDepth(2).setOrigin(0.5, 0.5)
        
        const inventoryCount = gameState.inventory.filter(item => item === towerType).length
        const inventoryText = this.add.text(x + 30, y - 35, inventoryCount, { 
            fontSize: '15px', fill: '#000000', fontFamily: "Arial" 
        }).setOrigin(0.5, 0.5).setDepth(2)
        
        const priceText = this.add.text(x, y + 35, `$${cost}`, { 
            fontSize: '14px', fill: '#ffff00', fontFamily: "Arial" 
        }).setOrigin(0.5, 0.5).setDepth(2)

        buyBtn.on("pointerdown", () => {
            if (gameState.money >= cost) {
                gameState.inventory.push(towerType)
                if (towerType === 'bow') {
                    gameState.bowInventory.push(towerType)
                }
                gameState.money -= cost
                
                // Update inventory display
                const newCount = gameState.inventory.filter(item => item === towerType).length
                inventoryText.setText(newCount)
            }
        })
    }

    createUpgradeButtons() {
        // Global Range Upgrade
        this.rangeBtn = this.add.image(800, 300, "RangeBtn").setScale(0.4).setInteractive()
        this.rangePriceText = this.add.text(800, 330, `Range\n$${this.rangePrice}`, { 
            fontSize: '16px', fill: '#00ff00', fontFamily: "Arial", align: 'center'
        }).setOrigin(0.5)
        
        this.rangeBtn.on("pointerdown", () => {
            const mainScene = this.scene.get("MainScene")
            if (gameState.money >= this.rangePrice) {
                for (let tower of mainScene.bows) {
                    tower.range = Math.min(400, tower.range + 20)
                }
                gameState.money -= this.rangePrice
                gameState.moneySpentOnUpgrades += this.rangePrice
                this.rangePrice = Math.floor(this.rangePrice * 1.3)
                this.rangePriceText.setText(`Range\n$${this.rangePrice}`)
            }
        })

        // Global Attack Speed Upgrade
        this.attackSpeedBtn = this.add.image(800, 400, "attackSpeedBtn").setScale(0.4).setInteractive()
        this.attackSpeedPriceText = this.add.text(800, 430, `Speed\n$${this.speedPrice}`, { 
            fontSize: '16px', fill: '#ffff00', fontFamily: "Arial", align: 'center'
        }).setOrigin(0.5)
        
        this.attackSpeedBtn.on("pointerdown", () => {
            const mainScene = this.scene.get("MainScene")
            if (gameState.money >= this.speedPrice) {
                for (let tower of mainScene.bows) {
                    tower.attackSpeed = Math.max(50, tower.attackSpeed - 25)
                    if (tower.bulletTimer) {
                        tower.bulletTimer.delay = tower.attackSpeed
                    }
                }
                gameState.money -= this.speedPrice
                gameState.moneySpentOnUpgrades += this.speedPrice
                this.speedPrice = Math.floor(this.speedPrice * 1.3)
                this.attackSpeedPriceText.setText(`Speed\n$${this.speedPrice}`)
            }
        })
    }

    update() {
        // Update money display
        this.moneyText.setText(`Money: $${gameState.money}`)
    }
}

class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathScene' })
    }
    
    preload() {
        // No assets needed for death screen
    }
    
    create() {
        // Game over display
        this.add.text(this.cameras.main.centerX, 150, 'GAME OVER', { 
            fontSize: '64px', 
            fill: '#ff0000',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5)
        
        // Final stats
        this.add.text(this.cameras.main.centerX, 250, 
            `Final Score: ${gameState.score}\n` +
            `Waves Survived: ${gameState.wave}\n` +
            `Total Kills: ${gameState.totalKills}\n` +
            `Money Earned: $${gameState.totalMoneyEarned}\n` +
            `Best Streak: ${gameState.maxStreak}`, {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5)
        
        // Restart button
        const restartBtn = this.add.text(this.cameras.main.centerX, 450, 'Click to Restart', { 
            fontSize: '32px', 
            fill: '#00ff00',
            backgroundColor: '#004400',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive()
        
        restartBtn.on('pointerdown', () => {
            // Reset game state
            this.resetGameState()
            
            // Clear save if desired
            SaveManager.clearSave()
            
            // Restart game
            this.scene.stop('MenuScene')
            this.scene.start('MainScene')
        })
        
        // Save high score
        this.saveHighScore()
    }
    
    resetGameState() {
        gameState.money = 1000
        gameState.wave = 1
        gameState.score = 0
        gameState.lives = 20
        gameState.inventory = []
        gameState.bowInventory = []
        gameState.totalKills = 0
        gameState.totalMoneyEarned = 0
        gameState.criticalMode = false
        gameState.bossWave = false
        gameState.powerUpActive = false
        gameState.comboMultiplier = 1
        gameState.streakCount = 0
        gameState.specialEvents = []
        gameState.killsThisWave = 0
        gameState.perfectWaves = 0
        gameState.towersBuilt = 0
        gameState.playtime = 0
    }
    
    saveHighScore() {
        const highScore = localStorage.getItem('towerDefenseHighScore')
        if (!highScore || gameState.score > parseInt(highScore)) {
            localStorage.setItem('towerDefenseHighScore', gameState.score.toString())
        }
    }
    
    update() {
        // No update logic needed
    }
}

// ===== LEGACY COMPATIBILITY CLASSES =====
// These maintain compatibility with the old system while transitioning to new enhanced classes

// Legacy Enemy class for compatibility
class LegacyEnemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, health) {
        super(scene, x, y, "drone")
        scene.add.existing(this)
        
        this.health = health
        this.fullHealth = health
        this.setScale(0.1)
        this.waypointIndex = 0
        this.sixtysixPercent = false
        this.thirtythreePercent = false
        this.healthText = null
    }

    moveAlongPath(pathPoints, speed) {
        if (this.waypointIndex >= pathPoints.length - 1) {
            gameState.lives--
            this.destroy()
            return
        }

        const target = pathPoints[this.waypointIndex]
        const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y)

        if (distance < 5) {
            this.waypointIndex++
            return
        }

        const direction = Math.atan2(target.y - this.y, target.x - this.x)
        this.x += Math.cos(direction) * speed
        this.y += Math.sin(direction) * speed
        this.rotation = direction
    }
}

// Legacy Tower class for compatibility  
class LegacyTower extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, range, attackSpeed) {
        super(scene, x, y, "bow")
        scene.add.existing(this)
        
        this.range = range
        this.attackSpeed = attackSpeed
        this.setScale(0.1)
        this.setInteractive()
        this.rangeSprite = null
    }

    aimAtClosestEnemy(enemies) {
        let closestEnemy = null
        let distanceToEnemy = Infinity

        for (let enemy of enemies) {
            if (enemy.health <= 0) continue
            
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)

            if (distance < distanceToEnemy && distance < this.range) {
                closestEnemy = enemy
                distanceToEnemy = distance
            }
        }

        if (closestEnemy) {
            const newRotation = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x)
            this.rotation = Phaser.Math.Linear(this.rotation, newRotation, 0.09)
            return closestEnemy
        }
        return null
    }

    upgradeRange(amount) {
        this.range += amount
    }

    upgradeAttackSpeed(amount) {
        this.attackSpeed = Math.max(50, this.attackSpeed - amount)
    }
}

// Legacy Bullet class for compatibility
class LegacyBullet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, damage, speed, range) {
        super(scene, x, y, "bullet")
        scene.add.existing(this)
        
        this.damage = damage
        this.bulletSpeed = speed
        this.range = range
        this.traveled = 0
        this.target = null
        this.setScale(0.5)
    }

    shootAtEnemy(target) {
        if (!target || target.health <= 0) {
            this.destroy()
            return
        }

        const directionX = target.x - this.x
        const directionY = target.y - this.y
        const distance = Math.sqrt(directionX * directionX + directionY * directionY)

        if (distance <= 15) {
            target.health -= this.damage
            if (target.health <= 0) {
                const reward = Math.floor(10 * gameState.moneyMultiplier)
                gameState.money += reward
                target.destroy()
            }
            this.destroy()
            return
        }

        if (this.traveled > this.range) {
            this.destroy()
            return
        }

        this.x += (directionX / distance) * this.bulletSpeed
        this.y += (directionY / distance) * this.bulletSpeed
        this.traveled += this.bulletSpeed
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