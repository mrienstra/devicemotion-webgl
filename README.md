# devicemotion-webgl

Devicemotion to WebGL.

# Node libraries

* [http](http://nodejs.org/api/http.html): HTTP server and client (built-in)
* [visionmedia/express](http://expressjs.com/): web application framework for node
* [einaros/ws](http://einaros.github.io/ws/): WebSocket server implementation

# Front-end libraries

* [jQuery](http://jquery.com/)
* [three.js](http://threejs.org/)
* [joewalnes/reconnecting-websocket](https://github.com/joewalnes/reconnecting-websocket)

# Running Locally

``` bash
npm install
foreman start
```

# Running on Heroku

``` bash
heroku create
heroku labs:enable websockets
git push heroku master
heroku open
```

# Updating Heroku & viewing log output

``` bash
git add .
git commit -m "Foo"
git push heroku master
heroku logs --tail
```