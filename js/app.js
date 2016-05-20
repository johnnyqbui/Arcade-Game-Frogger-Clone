// Player start properties and previous location
var previousX = 0,
previousY = 0,
startX = 0,
startY = 224;

// Enemy properties
var enemyY = -90,
enemyWidth = 60,
enemyHeight = 55,
minSpeed = 2,
maxSpeed = 4,
maxEnemy = 2,
prevMaxEnemy = 0,
blackFriday = false;

// Obstacle and item Properties
var objectWidth = 100,
objectHeight = 30,
maxObstacles = 2;

// Object properties that will be inheritable
function objectProp(x, y, width, height, sprite) {
    // Location and dimension properties
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.sprite = sprite
};

// Create all required object classes
function Enemy(x, y, speed, width, height, sprite) {
    objectProp.call(this,x,y,width,height,sprite)
    // Speed property for enemy
    this.speed = speed;
};

function Player(x, y, width, height) {
    objectProp.call(this,x,y,width,height);
    this.sprite = 'images/good-bug.png';
    // Set previous location
    previousX = x;
    previousY = y;
    // Level starts at 1
    this.level = 1;
    this.count = 0;
};

function Obstacle(x, y, width, height, sprite)  {
    objectProp.call(this,x,y,width,height,sprite);
};

function Item(x, y, width, height) {
    objectProp.call(this,x,y,width,height)
    this.sprite = 'images/Gem-Orange.png';
}

Enemy.prototype = Object.create(objectProp.prototype);
Enemy.prototype.constructor = Enemy;
Player.prototype = Object.create(objectProp.prototype);
Player.prototype.constructor = Player;
Obstacle.prototype = Object.create(objectProp.prototype);
Obstacle.prototype.constructor = Obstacle;
Item.prototype = Object.create(objectProp.prototype);
Item.prototype.constructor = Item;

// Draw objects
objectProp.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y)
}

// Update the enemy's position
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // Multiply any movement by the dt parameter which will ensure
    // the game runs at the same speed for all computers.
    this.y = this.y+(this.speed*60*dt);

    // Respawn enemies
    if (this.y > 410) {
        this.x = randomCol();
        this.y = -90;
        this.speed = randomSpeed();
        this.sprite = getChar();
    }

    // Activate black friday
    if (blackFriday) {
        maxEnemy = 20
    }

    newEnemy();
}

Player.prototype.update = function() {
// Reset player back to original position after reaching destination
// and increase level by 1
    if (this.x > 403) {
        this.level += 1;
        this.x = startX;
        this.y = startY;
        increaseLvl();
    };

    // Increase enemy speed when player reaches level 40
    if (player.level >= 40) {
        for (i = 0; i < allEnemies.length; i++){
            allEnemies[i].speed += 1;
        }
    }
};

// Set keyboard handler
Player.prototype.handleInput = function(key) {
    switch (key) {
        // Set boundaries so player cannot go outside of map
        // and set previous X and Y to prevent going through obstacles
        case 'left':
            if (this.x > 0) {
                this.x -= 100;
                previousX = this.x+100;
                previousY = this.y;
            }
            break;
        case 'right':
            if (this.x < 403) {
                this.x += 100;
                previousX = this.x-100;
                previousY = this.y;
            }
            break;
        case 'up':
            if (this.y > -25) {
                this.y -= 83;
                previousY = this.y+83;
                previousX = this.x
            }
            break;
        case 'down':
            if (this.y < 386) {
                this.y += 83;
                previousY = this.y-83;
                previousX = this.x;
            }
            break;
        }
};

Player.prototype.collision = function() {
    // Reset Player if collide with enemy
    if (checkCollision(this, allEnemies)) {
        this.x = startX;
        this.y = startY;
        this.count += 1;
        // Spawn item if player gets hit by enemy 10 times
        if (this.count%10 === 0) {
            if (allItem.length > 0) {
                allItem[0].x = 100;
                allItem[0].y = itemLocY();
            }
            newItem();
        }
    };

    // Prevent player from going through obstacle
    if (checkCollision(this, allObstacles)) {
        this.x = previousX;
        this.y = previousY;
    };

        // Effects when player grabs item
    if (checkCollision(this, allItem)) {
        allItem.splice(0,1);

        // Delete one obstacle if there is more than three on walkway
        if (allObstacles.length > 5) {
            allObstacles.splice(2,1);
            maxObstacles--;
        }
        // Collect the orange gem to stop black friday stampede
        else if (blackFriday === true) {
            blackFriday = false;
            maxEnemy = prevMaxEnemy;
        }
        // Delete enemies if there are more than seven
        else if (allEnemies.length >= 10) {
            maxEnemy--;
        }
        allEnemies.splice(7,2);
        timeSlow();
    }
}

Obstacle.prototype.collision = function() {
    // Place obstacle in different location if one already exists there
    if (allObstacles.length > 3
        && allObstacles[2].x === allObstacles[3].x
        && allObstacles[2].y === allObstacles[3].y
        ) {
        allObstacles[2].x = obstacleLocX();
        allObstacles[2].y = obstacleLocY();
    }

    // Place item in different area if an obstacle is in the way
    if (allItem.length > 0
        && allItem[0].x < (this.x + this.width)
        && (allItem[0].x + allItem[0].width) > this.x
        && allItem[0].y < (this.y + this.height)
        && (allItem[0].y + allItem[0].height) > this.y) {
        allItem[0].x = itemLocX;
        allItem[0].y = itemLocY;
    }
}

// Check if player collide with any enemies or obstacles
var checkCollision = function(player, object) {
    for (var i = 0; i < object.length; i++) {
        if (
            player.x < (object[i].x+object[i].width)
            && (player.x+player.width) > object[i].x
            && player.y < (object[i].y+object[i].height)
            && (player.y+player.height) > object[i].y
        ) {
            return true;
        };
    };
}

// Increase difficulty as level increases and randomize obstacles and item location
var increaseLvl = function() {
    // Ensures speed and enemy increases at same level
    if (player.level%3 === 0 && player.level%4 === 0) {
        maxEnemy++;
        minSpeed += 0.2;
        maxSpeed += 0.2;
    }
    else if (player.level%3 === 0 && player.level%5 === 0) {
        maxEnemy++;
        maxObstacles++;
    }
    // Enemy increases
    else if (player.level%3 === 0) {
        maxEnemy++;
    }
    // Speed increases
    else if (player.level%4 === 0) {
        minSpeed += 0.2;
        maxSpeed += 0.2;
    }
    // Number of obstacles increases
    else if (player.level%5 === 0) {
        maxObstacles++;
    }

    // Rock and bush randomizes on the grass
        allObstacles[0].y = obstacleLocY();
        allObstacles[0].sprite = getObstacle(1);

    // Randomize obstacles after player reaches destination
    for (var i = 2; i < allObstacles.length; i++) {
        allObstacles[i].x = obstacleLocX();
        allObstacles[i].y = obstacleLocY();
        allObstacles[i].sprite = getObstacle(0);
    }

    // Enable black friday stampede when player reaches level 25
    if (player.level === 25) {
        blackFriday = true
        prevMaxEnemy = maxEnemy
    }

    // Delete item if it hasn't been picked up
    if (allItem.length > 0) {
        allItem.splice(0,1)
    }

    // Spawn item, enemy, and obstacle when level increases
    getItem();
    newEnemy();
    newObstacle();
}

// Randomize number for enemy speed
var randomSpeed = function() {
    number = Math.random()*maxSpeed+minSpeed;
    return number;
};

// Randomize enemy spawn columns
var randomCol =  function() {
    number = Math.ceil(Math.random()*9);
    if (number <= 3) {
        return 203;
    } else if (number > 3 && number <= 6) {
        return 303;
    } else if (number > 6) {
        return 403;
    }
}

// Randomizes obstacle X location
var obstacleLocX = function() {
    number = Math.floor(Math.random()*3)+1
    if (number === 1) {
        return 200;
    } else if (number === 2) {
        return 300;
    } else if (number === 3) {
        return 400;
    }
}

// Randomizes obstacle Y location
var obstacleLocY = function() {
    number = Math.floor(Math.random()*5)+1
    if (number === 1) {
        return 58;
    } else if (number === 2) {
        return 141;
    } else if (number === 3) {
        return 224;
    } else if (number === 4) {
        return 307;
    } else if (number === 5) {
        return 390;
    }
}

// Randomizes item X location
var itemLocX = function() {
    number = Math.floor(Math.random()*5)+1
    if (number === 1) {
        return 0;
    } else if (number === 2) {
        return 100;
    } else if (number === 3) {
        return 200;
    } else if (number === 4) {
        return 300;
    } else if (number === 5) {
        return 400;
    }
}

// Randomizes item Y location
var itemLocY = function() {
    number = Math.floor(Math.random()*6)+1
    if (number === 1) {
        return -25;
    } else if (number === 2) {
        return 58;
    } else if (number === 3) {
        return 141;
    } else if (number === 4) {
        return 224;
    } else if (number === 5) {
        return 307;
    } else if (number === 6) {
        return 390;
    }
}

// Get random Enemy sprite
var getChar = function() {
    var char = Math.floor(Math.random()*5);
    allChar = ['images/char-boy.png',
        'images/char-horn-girl.png',
        'images/char-cat-girl.png',
        'images/char-pink-girl.png',
        'images/char-princess-girl.png'];
    return allChar[char]
}

// Get random Obstacle sprite
var getObstacle = function(num) {
    if (num === 0) {
    var obstacle = Math.floor(Math.random()*3);
    allObs = ['images/banana.png',
        'images/paper.png',
        'images/newspaper.png'];
        return allObs[obstacle]
    }

    if (num === 1) {
    obstacle = Math.floor(Math.random()*2);
        otherObs = ['images/Rock.png',
        'images/Tree Ugly.png'];
        return otherObs[obstacle]
    }
}

// Item randomly spawns when player reaches destination
var getItem = function() {
    variable = player.level/75
    var num = Math.random()+variable;
    if (num > 0.8) {
        newItem();
    }
}

// Create new objects
var allEnemies = [new Enemy(randomCol(),enemyY,randomSpeed(),enemyWidth,enemyHeight,getChar()),
                new Enemy(randomCol(),enemyY,randomSpeed(),enemyWidth,enemyHeight,getChar())];
var player = new Player(startX,startY,70,50);
var allObstacles = [new Obstacle(100,obstacleLocY(),objectWidth,objectHeight,getObstacle(1)),
                    new Obstacle(0,390,objectWidth,objectHeight,'images/Tree Tall.png')]
var allItem = [new Item(itemLocX(),itemLocY(),objectWidth,objectHeight)];

// Create new enemy and push to array when maxEnemy increases
var newEnemy = function() {
    if (allEnemies.length < maxEnemy) {
        var enemy = new Enemy(randomCol(),enemyY,randomSpeed(),enemyWidth,enemyHeight,getChar());
        allEnemies.push(enemy);
        }
    }

// Create new obstacle and push to array when maxObstacle increases
var newObstacle = function() {
    if (allObstacles.length < maxObstacles) {
        var obstacle = new Obstacle(obstacleLocX(),obstacleLocY(),objectWidth,objectHeight,getObstacle(0));
        allObstacles.push(obstacle);
        }
    }

// Create new item and push to array to be called
var newItem = function() {
    if (allItem.length < 1) {
        var item = new Item(itemLocX(),itemLocY(),objectWidth,objectHeight);
        allItem.push(item);
    }
}

// Slow enemies down temporarily
var timeSlow = function() {
    for (i = 0; i < allEnemies.length; i++) {
        allEnemies[i].speed = 0.7;
    }
}

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keydown', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

   player.handleInput(allowedKeys[e.keyCode]);
});