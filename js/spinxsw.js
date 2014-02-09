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
var translationFactor = 10;
var rotationFactor = 0.1;

// Universal Functions
var round = function(val) {
  var amt = 10;
  return Math.round(val * amt) /  amt;
};

var deviceMotionHandler = function(eventData) {
  var motion;

  if (eventData.acceleration) {
    var acceleration = eventData.acceleration;
  } else {
    var acceleration = eventData.accelerationIncludingGravity;
  }

  var rotation = eventData.rotationRate;

  motion = JSON.stringify([
    round(acceleration.x),
    round(acceleration.y),
    round(acceleration.z),
    round(rotation.alpha),
    round(rotation.beta),
    round(rotation.gamma)
  ]);

  if (motion !== '[0,0,0,0,0,0]' || motion !== lastMotion) {
    // send motion to node server, and update screen to reflect which way user is pointing
    sendSensorData(motion);
    //updateScreenCoordinates(client_angle);
    lastMotion = motion;
  }
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
  var data = JSON.parse(data);
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
  ws.onmessage = function (event) { // respond to node.js notifications coming back
    var message = JSON.parse(event.data);
    if (window.location.search === '?verbose') {
      console.log('onmessage', event, message);
    }
    var motion = reconstituteMotion(message.data);

    MovingCube.acceleration = {
      x: motion.x,
      y: motion.y,
      z: motion.z
    };

    MovingCube.rotateZ( motion.alpha * rotationFactor );
    MovingCube.rotateX( motion.beta  * rotationFactor );
    MovingCube.rotateY( motion.gamma * rotationFactor );
  };
};

// Init
init();