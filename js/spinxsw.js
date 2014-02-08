// -------------------------------------
// SpinXSW
// :: Interactive Lighting Installation
// -------------------------------------
//
// Set Global Vars
var ws;
var isMobile = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/) || false;
var data_frequency = 1; // polling interval at which to send client device data, '1' sends all data, '10' would be send every 10th data point
//
var num_lights = 18;
var current_color = 'rgb(102,255,255)'; // aqua
var light_increment = 360 / num_lights;
var current_light, rotations, starting_angle;

// Universal Functions
var deviceMotionHandler = function(eventData) {
  var info = '';

  if (eventData.acceleration) {
    var acceleration = eventData.acceleration;
  } else {
    var acceleration = eventData.accelerationIncludingGravity;
  }
  info += round(acceleration.x);
  info += ':' + round(acceleration.y);
  info += ':' + round(acceleration.z);

  var rotation = eventData.rotationRate;
  info += ':' + round(rotation.alpha);
  info += ':' + round(rotation.beta);
  info += ':' + round(rotation.gamma);

  // send motion to node server, and update screen to reflect which way user is pointing
  sendSensorData(info);
  //updateScreenCoordinates(client_angle);
};

var init = function(){
  openWebSocket();
  // Mobile Clients & Installation get different UIs and data logic
  $(document).ready(function(){
    if (isMobile) {
      // :: Mobile Logic
      initSwitcher('client');
      showClientUI();
      if (window.DeviceMotionEvent) {
        // listen for devicemotion events
        window.addEventListener('devicemotion', deviceMotionHandler, false);
      } else {
        fallback();
      }
    } else {
      // :: Installation Logic (& mock desktop light rig)
      initSwitcher('installation')
      showInstallationUI();
    }
  });
};

var initSwitcher = function(current_view){
  setSwitcherLabel(current_view);
  $('.switcher button').click(function(e){
    var $span = $('#switcher_view');
    var new_view = $span.html();
    if (new_view == 'Client') {
      showClientUI();
      $span.html('Installation');
    } else {
      showInstallationUI();
      $span.html('Client');
    }
  });
};

var openWebSocket = function(){
  var host = location.origin.replace(/^http/, 'ws');
  ws = new ReconnectingWebSocket(host);
};

var setSwitcherLabel = function(current_view){
  var new_view = (current_view == 'installation') ? 'Client' : 'Installation';
  $('#switcher_view').html(new_view);
};

var showClientUI = function(){
  $('#installation_ui').hide();
  $('#client_ui').show();
  ws.onopen = function(){
    console.log('registering self as client');
    ws.send(JSON.stringify({register: 'client'}));
  };
}

var showInstallationUI = function(){
  $('#client_ui').hide();
  $('#installation_ui').show();
  showAnimation();
  ws.onopen = function(){
    console.log('registering self as installation');
    ws.send(JSON.stringify({register: 'installation'}));
  };
};

// Mobile Client Functions
var fallback = function(){
  $('#client_ui h1').html('Sorry, your device is not supported!');
};

var sendSensorData = function(deg) {
  ws.send(deg);
};

var showCurrentAngle = function(deg){
  $('#client_angle').html(deg);
};

var showTotalArc = function(deg){
  // TODO: need to do some math here to set a threshold: when deg goes from 340-360 to 0-20 (or vice versa) we keep adding to the arc
  var total_arc = deg;
  $('#arc').html(total_arc);
  return total_arc;
};

var showTotalRotations = function(arc){
  rotations = Math.floor(arc/360);
  $('#rotations').html(rotations);
  return rotations;
};

var updateScreenCoordinates = function(deg) {
  showCurrentAngle(deg);
  var arc = showTotalArc(deg);
  showTotalRotations(arc);
};

// Installation Functions
var showAnimation = function(){
  initThree();
  setMessageListener();
};

var reconstituteMotion = function(data){
  var data = data.split(':');
  return {
    x:     data[0],
    y:     data[1],
    z:     data[2],
    alpha: data[3],
    beta:  data[4],
    gamma: data[5]
  };
};

var setMessageListener = function(){
  if (typeof(current_light) === 'undefined') current_light = 0; // set first light to show
  ws.onmessage = function (event) { // respond to node.js notifications coming back
    var message = JSON.parse(event.data);
    if (window.location.search === '?verbose') {
      console.log('onmessage', event, message);
    }
    var motion = reconstituteMotion(message.data);

    MovingCube.translateX( motion.x );
    MovingCube.translateY( motion.y );
    MovingCube.translateZ( motion.z );

    MovingCube.rotateX( motion.alpha );
    MovingCube.rotateY( motion.beta  );
    MovingCube.rotateZ( motion.gamma );
  };
};

// Init
init();