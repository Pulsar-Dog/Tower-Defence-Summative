import Phaser from "phaser"

const config = {
    type: Phaser.WEBGL,
    width: 1100,
    height: 650,
    scene: {
        preload: preload,
        create: create,
        update: update
    },

    physics: {
        default: "arcade",
        arcade: {
            gravity: {x: 0, y: 0}
        }
    }
}

function preload() {
    this.load.image("player", "player.png")
}

function create() {
    console.log("create")
}

function update() {
    console.log("update")
}

new Phaser.Game(config)