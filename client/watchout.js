
setCookie = function (cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = 'expires=' + d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
};

getCookie = function (cname) {
  var name = cname + '=';
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};

checkCookie = function () {
  var username = getCookie('username');
  if (username !== '') {
    alert('Welcome again ' + username);
  } else {
    username = prompt('Please enter your name:', '');
    if (username !== '' && username != null) {
      setCookie('username', username, 365);
    }
  }
};

// start slingin' some d3 here.
var highscoreCookie = getCookie('highscore');
if (highscoreCookie !== '') {
  d3.select('.highscore').select('span').html(highscoreCookie);
}
checkCookie();
var something = 'asteroid.png';
const crash = new Audio('../assets/crash.mp3');
const pew = new Audio('../assets/pew.mp3');
crash.load();
pew.load();
var level = 1;
var keyPressed = {};
var bullets = [];
var collisionAt = Date.now();
var background = 'https://media-s3-us-east-1.ceros.com/lockheed-martin/images/2019/09/27/9b047bfcc574c1a6fccd7370190491d7/ahead-of-the-curve-4k.jpg';
var bulletImage = 'https://images.squarespace-cdn.com/content/522a22cbe4b04681b0bff826/1478280799815-SNJGJ4VICZJLF7JWZR09/hrhq-avatar.png';
var width = 1000;
var height = 800;
var svg = d3.select('body')
  .append('svg')
  .attr('class', 'universe')
  .attr('width', width)
  .attr('height', height)
  .style('background-image', `url(${background})`)
  .style('background-size', 'cover');
//Set the filter for the image to show on the circle element of svg
svg.append('filter')
  .attr('id', 'asteroid')
  .attr('x', '0%')
  .attr('y', '0%')
  .attr('width', '100%')
  .attr('height', '100%')
  .append('feImage')
  .attr('xlink:href', 'asteroid.png');
svg.append('filter')
  .attr('id', 'bullet')
  .attr('x', '0%')
  .attr('y', '0%')
  .attr('width', '100%')
  .attr('height', '100%')
  .append('feImage')
  .attr('xlink:href', `url(${bulletImage})`);

var drag = d3.behavior.drag()
  .on('drag', this.control);

d3.select('body')
  .on('keydown', function () {
    keyPressed[d3.event.keyCode] = true;
  })
  .on('keyup', function () {
    keyPressed[d3.event.keyCode] = false;
  });
var asteroids = [];
var newLevel = function () {
  d3.selectAll('.asteroid').remove();
  d3.selectAll('.bullet').remove();
  asteroids = [];
  let randomAmount = Math.ceil(Math.random() * (level + 2)) + 1;
  for (var id = 0; id < randomAmount; id++) {
    let r = (Math.ceil(Math.random() * 120) + 50) / 2;
    let cy = Math.ceil(Math.random() * height);
    let cx = Math.ceil(Math.random() * width);
    let angle = Math.ceil(Math.random() * 360);
    let velocity = (Math.random() * 3) + 1;
    asteroids[id] = svg.append('circle')
      .attr('class', 'asteroid')
      .attr('id', 'asteroid' + id)
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', r)
      .attr('filter', 'url(#asteroid)');
    asteroids[id].health = 50;
    asteroids[id].cx = cx;
    asteroids[id].cy = cy;
    asteroids[id].r = r;
    asteroids[id].angle = angle * Math.PI / 180;
    asteroids[id].velocity = velocity;
    asteroids[id].attr('transform', function () {
      return 'translate(' + cx + ',' + cy + ')';
    });
    asteroids[id].move = function (cx, cy) {
      //var dx = this.cx - x;
      //var dy = this.cy - y;
      // if (dx !== 0 || dy !== 0) {
      //   this.angle = 360 * (Math.atan2(dy, dx) / (Math.PI * 2));
      // }
      this.attr('transform', function () {
        return 'translate(' + [this.cx, this.cy].join() + ')';
      }.bind(this));
    };
    asteroids[id].break = function () {
      let totalSize = 0;
      let id = asteroids.length;
      if (this.r > 35) {

        for (var i = 0; i < 5 && totalSize <= this.r; i++) {
          size = Math.ceil(Math.random() * (this.r - totalSize));
          if (size < 25) {
            size += 15;
          }
          asteroids[id] = svg.append('circle')
            .attr('class', 'asteroid')
            .attr('id', 'asteroid' + id)
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', size)
            .attr('filter', 'url(#asteroid)');
          asteroids[id].health = size;
          asteroids[id].cy = this.cy;
          asteroids[id].cx = this.cx;
          asteroids[id].r = size;
          asteroids[id].angle = Math.ceil(Math.random() * 360) * Math.PI / 180;
          asteroids[id].velocity = (Math.random() * (this.velocity - 1)) + 1;
          asteroids[id].break = this.break;
          asteroids[id].move = this.move;
          id++;
          totalSize += size;
        }
      }
    };
  }
};

newLevel();
// Crude ship drawing
// TODO---Allow for multiple ships and rewrite all of this crap.
var moveBullet = function (cx, cy) {
  if (this.decay > 0) {
    // reduce the distance value each render
    this.decay -= this.velocity;

    this.attr('transform', function () {
      return 'translate(' + [this.cx, this.cy].join() + ')';
    }.bind(this));
  } else {
    // if the distance is less than zero remove it from the DOM and bullets array
    bullets.splice(bullets.indexOf(this), 1);
    this.remove();
  }
};
var ship = svg.append('polygon')
  .attr('fill', 'white')
  .attr('stroke', 'red')
  .attr('stroke-width', 2)
  .attr('points', '0, 30 0, 0 40, 15 ');
ship.x = 500;
ship.y = 300;
ship.angle = 0;
ship._speed = 10;
ship.velocity = 0;
ship.firingRate = 25;
ship.attr('transform', function () {
  return 'translate(' + ship.x + ',' + ship.y + ')';
});
ship.move = function (x, y) {
  if (this.firingRate > 0) {
    this.firingRate -= 1;
  }
  ship.attr('transform', function () {
    return 'rotate(' + [ship.angle, ship.x + 20, ship.y + 15].join() + ')' +
      'translate(' + [ship.x, ship.y].join() + ')';
  }.bind(this));
};
ship.fire = function () {
  this.firingRate - level;
  if (this.firingRate === 0) {
    ship.firingRate = 25;
    pew.play();
    // Create bullet at same angle as ship
    bullet = svg.append('circle')
      .attr('class', 'bullet')
      .attr('id', 'bullet' + bullets.length)
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 6)
      .attr('fill', 'white')
      .attr('stroke', 'red')
      .attr('stroke-width', 2);
    //.attr('filter', 'url(#bullet)');
    bullets.push(bullet);
    bullet.cx = ship.x + 20;
    bullet.cy = ship.y + 15;
    bullet.decay = 600 + (10 * level);
    bullet.velocity = this.velocity + 3;
    bullet.angle = this.angle * Math.PI / 180;
    bullet.attr('transform', function () {
      return 'translate(' + bullet.cx + ',' + bullet.cy + ')';
    });
    bullet.move = moveBullet;
  }
};

var dragmove = function (d) {
  var x = d3.event.x;
  var y = d3.event.y;
  d3.select(this).attr('transform', 'translate(' + x + ',' + y + ')');
};

//This has been updated to allow for wrapping vs stopping at the borders
//old version is commented out
var isInBounds = function (n, dimension) {
  if (n < 0) {
    // we have to return a value inside to account for the size of the ship
    // TODO - make this work for multiple ships by using a variable subtracted from dimension of svg element
    return svg.attr(dimension) - 20;
    //return 0;
  } else if (n > svg.attr(dimension)) {
    return 0;
    //return svg.attr(dimension);
  } else {
    return n;
  }
};

var control = function () {
  /*
  37: left
  38: up
  39: right
  40: down
  */

  var speed = ship._speed;
  var velocity = ship.velocity;
  // Angle in radians = Angle in degrees x PI / 180
  var angle = ship.angle * Math.PI / 180;
  // reset the angle when above 360 (mainly for human readability)
  if (ship.angle > 360) {
    ship.angle -= 360;
  }
  if (ship.angle < 0) {
    ship.angle += 360;
  }

  //Lshift 16
  if (keyPressed['16']) {
    // Fire bullets
    ship.fire();


  }
  //Space
  if (keyPressed['space']) {
    //TODO add a torpedo sound
    // fire our torpedo
  }

  //left(37) or a(65)
  if (keyPressed['37'] || keyPressed['65']) {
    ship.angle -= 3;
  }
  //right(39) or d(68)
  if (keyPressed['39'] || keyPressed['68']) {
    ship.angle += 3;
  }


  //Momentum = mass • velocity
  // p = m * v
  //up(38) or w(87)
  if (keyPressed['38'] || keyPressed['87']) {
    // increase speed slightly to suggest thrust
    // we need to calculate velocity and change it over time
    // for now we are simply going to increase it to a max of 100
    if (ship.velocity < 7) {
      ship.velocity += 0.5;
    }

  }
  //down(40) or s(83)
  if (keyPressed['40'] || keyPressed['83']) {
    // Negative acceleration
    if (ship.velocity > 0) {
      ship.velocity -= 0.5;
    }
  }





  // Make a bullet move function

  // cycle through each rendered bullet with select all
  for (var id = 0; id < bullets.length; id++) {
    // move bullet in direction of its own angle that was set to ship at time of firing
    let cx = isInBounds(bullets[id].cx + bullets[id].velocity * Math.cos(bullets[id].angle), 'width');
    let cy = isInBounds(bullets[id].cy + bullets[id].velocity * Math.sin(bullets[id].angle), 'height');
    bullets[id].cx = Math.floor(cx);
    bullets[id].cy = Math.floor(cy);
    bullets[id].move(cx, cy);
  }


  //Move each asteroid based on its velocity and direction
  for (var id = 0; id < asteroids.length; id++) {
    // We calculate the distance to each asteroid and if the distance is close enough we fire a collision
    // Using the pythagreom theorem...
    //Collision if (ship.x-cx)^2 + (ship.y - cy)^2 < r^2
    let distance = Math.pow((ship.x - asteroids[id].cx), 2) + Math.pow((ship.y - asteroids[id].cy), 2);
    // Check if the distance is less than radius squared of the current asteroid
    area = Math.pow(asteroids[id].r, 2);
    if (distance < area) {
      //TODO tally a collision and end level
      var now = Date.now();
      if (collisionAt < now - 3000) {
        collisionAt = now;
        count = Number(d3.select('.collisions').select('span').html()) + 1;
        d3.select('.collisions').select('span').html(count);
        crash.play();
      }
      // TODO restart game based off of amount of collisions... maybe 10
      //alert('collision!');
      //newLevel();
    }
    // Check each asteroid for whether it has been hit by a bullet
    for (var jd = 0; jd < bullets.length && asteroids[id]; jd++) {
      let distance = Math.pow((bullets[jd].cx - asteroids[id].cx), 2) + Math.pow((bullets[jd].cy - asteroids[id].cy), 2);
      if (distance < area) {
        bullet = bullets[jd];
        bullet.remove();
        bullets.splice(jd, 1);
        if (asteroids[id].health > 0) {
          // TODO add to the score for a hit based on size of asteroid
          asteroids[id].health -= 10;
          // Otherwise asteroid is destroyed/broken
        } else {
          // Invoke asteroid break function
          asteroids[id].break();
          // TODO perhaps move this to the asteroid break function
          // Add to score based on size of asteroid
          points = Math.ceil(1000 / asteroids[id].r) * level;
          score = Number(d3.select('.current').select('span').html());
          score += points;
          d3.select('.current').select('span').html(score);
          // Remove asteroid from DOM
          asteroids[id].remove();
          // Remove asteroid from asteroid array
          asteroids.splice(id, 1);
        }
      }

    }
    if (asteroids[id]) {
      let cx = isInBounds(asteroids[id].cx + asteroids[id].velocity * Math.cos(asteroids[id].angle), 'width');
      let cy = isInBounds(asteroids[id].cy + asteroids[id].velocity * Math.sin(asteroids[id].angle), 'height');
      asteroids[id].cx = Math.floor(cx);
      asteroids[id].cy = Math.floor(cy);
      asteroids[id].move(cx, cy);
    }
  }
  if (asteroids.length === 0) {


    highscore = Number(d3.select('.highscore').select('span').html());
    if (highscore < score) {
      d3.select('.highscore').select('span').html(score);
      setCookie('highscore', score, 365);
    }
    level += 1;
    newLevel();
  }

  //Moved this outside of the keypress to allow for using velocity vs forward on keyPress
  ship.x = isInBounds(ship.x + ship.velocity * Math.cos(angle), 'width');
  ship.y = isInBounds(ship.y + ship.velocity * Math.sin(angle), 'height');
  ship.move(ship.x, ship.y);
};

// d3 timer to handle control renders
d3.timer(control);