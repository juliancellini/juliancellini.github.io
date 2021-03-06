var VK_ENTER                    =    13;
var VK_PAUSE                    =    19;
var VK_PAGE_UP                  =    33;
var VK_PAGE_DOWN                =    34;
var VK_LEFT                     =    37;
var VK_UP                       =    38;
var VK_RIGHT                    =    39;
var VK_DOWN                     =    40;
var VK_0                        =    48;
var VK_1                        =    49;
var VK_2                        =    50;
var VK_3                        =    51;
var VK_4                        =    52;
var VK_5                        =    53;
var VK_6                        =    54;
var VK_7                        =    55;
var VK_8                        =    56;
var VK_9                        =    57;
var VK_D                        =    68;
var VK_RED                      =   403;
var VK_GREEN                    =   404;
var VK_YELLOW                   =   405;
var VK_BLUE                     =   406;
var VK_REWIND                   =   412;
var VK_STOP                     =   413;
var VK_PLAY                     =   415;
var VK_FAST_FWD                 =   417;
var VK_INFO                     =   457;
var VK_BACK                     =   461;
var VK_DONE                     = 65376;
var VK_RETURN                   = 10009;
var VK_RETURNHUB                = 65385;
var VK_EXIT                     = 10182;
var VK_CAPTION                  = 10221;
var VK_ESCAPE                   =    27; 
var VK_SPACE                    =    32; 

function JCPlayer() {
    this.debug = false;
    this.delayedSeek = false;
    this.verbose = false;
    this.initialSeek = null;
    this.heartbeatURL = null;
    this.heartbeatInterval = 60;
    this.heartbeatOnPause = true;
    this.heartbeatOnSeek = true;
    this.heartbeatOnEnd = true;
    this.heartbeatOnInterval = true;
    this.heartbeatOnDestroy = true;    
    this.HEARTBEAT_TEMPLATE_SECONDS = "__SECONDS__";
    this.DEBUG_DIV_ID = "jcplayer_debug_id";

    var _lastHeartbeat = 0;
    var that = this;
    var _player = null;
    var _trackCurrent = -1;
    var _focusElement = null;
    var _focusElementInterval = null;
    var _yellowButtonCounter = 0;

    this.onPlay = function(event){};
    this.onPause = function(event){};
    this.onEnded = function(event){ };
    this.onTimeUpdate = function(event){};
    this.onHeartbeat = function(event, heartbeat, reason){};
    
    this.onKeyDown = function(event){ };
    
    this.onClose = function(){ };
    this.onUp = function(){ };
    this.onDown = function(){ };
    this.onLeft = function(){ };
    this.onRight = function(){ };
    this.onNumber = function(number){ };
    this.onPlayPause = function(isPlay){ };
    this.onStop = function(){ };

    this.onButtonRed = function(){ };
    this.onButtonGreen = function(){ };
    this.onButtonYellow = function(){ };
    this.onButtonBlue = function(){ };

    function _doDebugOutput(msg){
        
        console.log(msg);

        var divElem = document.getElementById(that.DEBUG_DIV_ID);
        if (divElem){
            divElem.innerHTML += msg + "\n"; 
            divElem.scrollTop = divElem.scrollHeight;
        }
    }

    function _doHandleError(error){        
        _onError(error, "_doHandleError");
    }

    function _doHeartbeat(e, reason){

       _lastHeartbeat = Math.round(e.seconds);
        if (that.heartbeatURL !== null){
            var url = that.heartbeatURL.replace(that.HEARTBEAT_TEMPLATE_SECONDS, _lastHeartbeat);
            getCORS(url);                    
        }
        that.onHeartbeat(e, _lastHeartbeat, reason);
    }

    function _onSeeked(e) {
        if (that.debug){
            m = 'seek ' + e.seconds + ' of ' + e.duration + ' seconds (' +  (e.percent * 100).toFixed(2) + '%). HeartBeat=' + (_lastHeartbeat + that.heartbeatInterval);
            _doDebugOutput(m);
        }       

        _lastHeartbeat = Math.floor(e.seconds / that.heartbeatInterval) * that.heartbeatInterval;  

        if (that.heartbeatOnSeek){
            _doHeartbeat(e, "OnSeeked");
        }
    }

    function _onTimeupdate(e) {

        if (that.debug && that.verbose){
            m = 'timeupdate ' + e.seconds + ' of ' + e.duration + ' seconds (' +  (e.percent * 100).toFixed(2) + '%). HeartBeat=' + (_lastHeartbeat + that.heartbeatInterval);
            _doDebugOutput(m);
        }
  
        if (that.heartbeatOnInterval && (e.seconds > (_lastHeartbeat + that.heartbeatInterval))){
            _doHeartbeat(e, "OnInterval");
        }                               

        that.onTimeUpdate(e);
    }

    function _doVolumeUp() {

        _player.getVolume().then(function(volume) {
            if (volume < 1){
                _player.setVolume(Math.min(volume + 0.1, 1)).catch(_doHandleError);
            } 
        });
    }

    function _doVolumeDown() {

        _player.getVolume().then(function(volume) {
            if (volume > 0){
                _player.setVolume(Math.max(volume - 0.1, 0)).catch(_doHandleError);
            } 
        });
    }

    function _onKeyDown(e) {

        if (!_player){
            _doDebugOutput("NOT PLAYER!");
            return;
        }

        if (that.debug){
            _doDebugOutput("_onKeyDown: " + e.keyCode + " e.code: " + e.code);
        }

        if (that.onKeyDown(e) === false) {
            return;
        }

        var keyCode = e.keyCode;

        if (keyCode !== VK_YELLOW){
            //clear show div_debug;
            _yellowButtonCounter = 0;
        }

        if (keyCode === VK_ESCAPE || keyCode === VK_BACK){          
            if (that.onClose() === false) {
                return;
            }
            _doDebugOutput("ESCAPE!");
            return;
        }

        if (keyCode === VK_UP){         
            if (that.onUp() === false) {
                return;
            }

            _doVolumeUp();
            return;
        }

        if (keyCode === VK_DOWN){           
            if (that.onDown() === false) {
                return;
            }

            _doVolumeDown();
            return;
        }

        if (keyCode === VK_LEFT){           
            if (that.onLeft() === false) {
                return;
            }

            _player.getCurrentTime().then(function(seconds) {
                if (seconds < 30) { 
                    seconds = 30;
                }
                _player.setCurrentTime(seconds - 30).catch(_doHandleError);
            });
            return;
        }

        if (keyCode === VK_RIGHT){          
            if (that.onRight() === false) {
                return;
            }

            _player.getCurrentTime().then(function(seconds) {
                _player.getDuration().then(function(duration) {
                    if (seconds + 30 < duration) { 
                        _player.setCurrentTime(seconds + 30).catch(_doHandleError);
                    }                   
                });
            });
            return;
        }

        if (keyCode >= VK_0 && keyCode <= VK_9){

            var number = keyCode - VK_0;

            if (that.onNumber(number) === false) {
                return;
            }

            _player.getDuration().then(function(duration) {
                that.seek(number * duration / 10);
            });
            
            return;
        }

        if (keyCode === VK_STOP){           
            if (that.onStop() === false) {
                return;
            }
            _doDebugOutput("STOP!");
            return;
        }

        if (keyCode === VK_PLAY || keyCode === VK_PAUSE || keyCode === VK_SPACE || keyCode === VK_ENTER ){           
            if (that.onPlayPause(keyCode === VK_PLAY) === false) {
                return;
            }
            that.playPause();
            return;
        }

        if (keyCode === VK_RED){   
            document.getElementById(that.DEBUG_DIV_ID).style.display = "none";          
            
            if (that.onButtonRed() === false) {
                return;
            }

            _doVolumeUp();
            return;
        }

        if (keyCode === VK_GREEN){
            document.getElementById(that.DEBUG_DIV_ID).style.display = "none";
            
            if (that.onButtonGreen() === false) {
                return;
            }
            
            _doVolumeDown();
            return;
        }

        if (keyCode === VK_YELLOW){         
            if (that.onButtonYellow() === false) {
                return;
            }

            _yellowButtonCounter++;

            if (_yellowButtonCounter >= 3){
                document.getElementById(that.DEBUG_DIV_ID).style.display = "";
                that.debug = true;
                _yellowButtonCounter = 0;
            }
            return;
        }

        if (keyCode === VK_BLUE){
            document.getElementById(that.DEBUG_DIV_ID).style.display = "none";            
            
            if (that.onButtonBlue() === false) {
                return;
            }
            that.setNextTrack();
            return;
        }

        if (keyCode === VK_D){
            
            var divElem = document.getElementById(that.DEBUG_DIV_ID);
            if (divElem){
                divElem.style.display = (divElem.style.display === "none" ? "" : "none");
                that.debug = true;
            } 

            return;
        }

        _doDebugOutput("_onKeyDown Unhandled!");

    }

    function _onPlay(e) {

        if (that.debug){
            m = 'onPlay ' + e.seconds + ' of ' + e.duration + ' seconds (' +  (e.percent * 100).toFixed(2) + '%). HeartBeat=' + (_lastHeartbeat + that.heartbeatInterval);
            _doDebugOutput(m);
        }

        that.onPlay(e);
    }
    
    function _onPause(e) {

        if (that.debug){
            m = 'onPause ' + e.seconds + ' of ' + e.duration + ' seconds (' +  (e.percent * 100).toFixed(2) + '%). HeartBeat=' + (_lastHeartbeat + that.heartbeatInterval);
            _doDebugOutput(m);
        }

        if (that.heartbeatOnPause){
            _doHeartbeat(e, "OnPause");
        }                               

        that.onPause(e);
    }

    function _onEnded(e) {

        if (that.debug){
            m = 'onEnded ' + e.seconds + ' of ' + e.duration + ' seconds (' +  (e.percent * 100).toFixed(2) + '%). HeartBeat=' + (_lastHeartbeat + that.heartbeatInterval);
            _doDebugOutput(m);
        }

        if (that.heartbeatOnEnd){
            _doHeartbeat(e, "OnEnd");
        }    

        that.onEnded(e);
    }

    function _onError(e, description) {

        description = description || "onErrorEvent";

        m = description + ' {name: "' + e.name + '", method: "' + e.method + '", message: "' + e.message + '"}';
        _doDebugOutput(m);
    }

    function _onBufferEnd(e) {

        m = 'onBufferEnd';
        _doDebugOutput(m);

        if (that.initialSeek){
            var currentTime = that.initialSeek;
            _doDebugOutput("onBufferEnd (delayedSeek) initialSeek = " + currentTime);
            _player.setCurrentTime(currentTime).catch(_doHandleError);
            that.initialSeek = null;
        }   
    }

    function _onBufferStart(e) {

        m = 'onBufferStart';
        _doDebugOutput(m);
    }

    function _onLoaded(e) {

        if (that.debug){
            m = 'onLoaded id=' + e.id;
            _doDebugOutput("==============================");
            _doDebugOutput(m);
            _doDebugOutput("------------------------------");
        }

        if (that.initialSeek && !that.delayedSeek){
            if (_player){
                var currentTime = that.initialSeek;
                setTimeout(function() {
                    _doDebugOutput("setCurrentTime initialSeek = " + currentTime);
                    _player.setCurrentTime(currentTime).catch(_doHandleError);}
                , 10000);                
            }
            that.initialSeek = null;
        }    
    }

    this.initialize = function (iframe) {       
        var element = document.getElementById(iframe);
        if (element) {
            iframe = element;
        }

        if (_player){ 
            _player.destroy();
            _lastHeartbeat = -1;        
        }

        _trackCurrent = -1;

        _player = new Vimeo.Player(iframe);

        _player.on('error', _onError);
        _player.on('timeupdate', _onTimeupdate);
        _player.on('play', _onPlay);
        _player.on('seeked', _onSeeked);
        _player.on('ended', _onEnded);
        _player.on('pause', _onPause);
        _player.on('loaded', _onLoaded);
        _player.on('bufferstart', _onBufferStart);
        _player.on('bufferend', _onBufferEnd);

    }

    this.create = function (elementOrId, IdVimeo, allowFullScreen) {        
        var element = document.getElementById(elementOrId);
        if (element) {
            elementOrId = element;
        }

        if (elementOrId) {

            if (_focusElementInterval){
                clearInterval(_focusElementInterval);
                _focusElementInterval = null;
            }

            if (_focusElement){         
                _focusElement.parentNode.removeChild(_focusElement);
                _focusElement = null;
            }

            _focusElement = document.createElement('div');
            _focusElement.tabIndex = "0";           
            _focusElement.addEventListener('keydown', _onKeyDown);
            
            elementOrId.appendChild(_focusElement);         
            
            _focusElementInterval = setInterval(function () { _focusElement.focus(); }, 100);

            var iframe = document.createElement('iframe');
            iframe.src = 'https://player.vimeo.com/video/' + IdVimeo + "?app_id=122963";
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = 0;
            iframe.frameBorder = 0;
            iframe.tabIndex = "-1";
            iframe.allow = "autoplay";
            if (allowFullScreen) {
                iframe.setAttribute("allowfullscreen", true);
            }

            elementOrId.appendChild(iframe);

            if (document.getElementById(that.DEBUG_DIV_ID) === null)
            {
                var debugDiv = document.createElement('div');
                debugDiv.style = "position:absolute;width:500px;right:20px;top:20px;bottom:50%;opacity:.7;" + 
                                 "background-color:black;color:white;border:1px solid white;white-space:pre;" + 
                                 "overflow-x:hidden;font-family:monospace;font-weight:bold;padding:5px;" + 
                                 "display:none;z-index:999999;";
                debugDiv.id = that.DEBUG_DIV_ID;
                
                elementOrId.appendChild(debugDiv);
            }

            that.initialize(iframe);

        } else {
            console.log("JCPlayer.create: " + elementOrId + " NOT FOUND!");
        }
    }

    this.seek = function (seconds) {
        if (_player){
            _player.setCurrentTime(seconds).catch(_doHandleError);
        }
    }

    this.play = function () {
        if (_player){
            _player.play().catch(_doHandleError);
        }
    }

    this.pause = function () {
        if (_player){
            _player.pause().catch(_doHandleError);
        }
    }

    this.setNextTrack = function () {
        if (_player){
            _player.getTextTracks().then(function(tracks) {
                if (tracks.length == 0) {
                    return;
                }

                _trackCurrent++;
                if (_trackCurrent == tracks.length){
                    _trackCurrent = -1;
                    _player.disableTextTrack();
                    return;
                }

                var track = tracks[_trackCurrent];

                _player.enableTextTrack(track.language, track.kind);
            });
        }
    }

    this.playPause = function(){
        if (_player){
            _player.getPaused().then(function(paused) {
                if (paused) {
                    _player.play().catch(_doHandleError);
                } else {
                    _player.pause().catch(_doHandleError);    
                }
            }).catch(_doHandleError);
        }       
    }

    this.destroy = function () {

        if (that.debug){
            m = 'destroy ';
            _doDebugOutput(m);
            _doDebugOutput("==============================");
            _doDebugOutput("");
        }   

        if (_focusElementInterval){
            clearInterval(_focusElementInterval);
            _focusElementInterval = null;
        }

        if (_focusElement){         
            _focusElement.parentNode.removeChild(_focusElement);
            _focusElement = null;
        }

        if (_player){       

            if (that.heartbeatOnDestroy){
                
                _player.getCurrentTime().then(function(seconds) {
                    _player.getDuration().then(function(duration) {
                        e = {
                            duration: duration, 
                            percent: (seconds / duration), 
                            seconds: seconds
                        };
                
                        _doHeartbeat(e, "OnDestroy");
                        
                        _player.destroy();
                        _player = null;                  
                    });
                });
            } else {
                _player.destroy();
                _player = null;
            }
        }
    }

    this.unload = function () {
        if (_player){
            _player.unload();
        }        
    }

    this.loadVideo = function (id) {
        if (_player){
            _player.loadVideo(id);
        }
    }
}


function getCORS(url, success) {
    var xhr = new XMLHttpRequest();
    if (!('withCredentials' in xhr)) xhr = new XDomainRequest(); // fix IE8/9
    xhr.open('GET', url);
    xhr.onload = success;
    xhr.send();
    return xhr;
}
