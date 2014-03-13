( function( mw, $ ) {"use strict";

	mw.PluginManager.add( 'chromecast', mw.KBaseComponent.extend({

		defaultConfig: {
			'parent': 'topBarContainer',
			'order': 7,
            'align': "right",
            'tooltip': 'Chromecast'
		},

        applicationID: "DB6462E9",
        progressFlag: 1,
        currentMediaSession: null,
        mediaCurrentTime: 0,
        casting: false,
        session: null,
        request: null,
        updateInterval: null,

        startCastTitle: gM( 'mwe-embedplayer-startCast' ),
        stopCastTitle: gM( 'mwe-embedplayer-stopCast' ),

		setup: function( embedPlayer ) {
            var _this = this;
            this.getComponent().addClass("disabled");
            window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
                if (loaded) {
                    _this.initializeCastApi();
                } else {
                    mw.log(errorInfo);
                }
            }
		},

        addBindings: function() {
            var _this = this;
            $(this.embedPlayer).bind('chromecastPlay', function(){_this.playMedia()});
            $(this.embedPlayer).bind('chromecastPause', function(){_this.pauseMedia()});
            $(this.embedPlayer).bind('chromecastGetCurrentTime', function(){_this.getCurrentTime()});
            $(this.embedPlayer).bind('chromecastGetCurrentTime', function(e, percent){_this.setVolume(e,percent)});
        },

		getComponent: function() {
            var _this = this;
            if( !this.$el ) {
                this.$el = $( '<button />' )
                    .attr( 'title', this.startCastTitle )
                    .addClass( "btn icon-chromecast" + this.getCssClass() )
                    .click( function() {
                        _this.toggleCast();
                    });
            }
            return this.$el;
		},

        getCssClass: function() {
            var cssClass = ' comp ' + this.pluginName + ' ';
            switch( this.getConfig( 'align' ) ) {
                case 'right':
                    cssClass += " pull-right";
                    break;
                case 'left':
                    cssClass += " pull-left";
                    break;
            }
            if( this.getConfig('cssClass') ) {
                cssClass += ' ' + this.getConfig('cssClass');
            }
            if( this.getConfig('displayImportance') ){
                var importance = this.getConfig('displayImportance').toLowerCase();
                if( $.inArray(importance, ['low', 'medium', 'high']) !== -1 ){
                    cssClass += ' display-' + importance;
                }
            }
            return cssClass;
        },

        toggleCast : function(){
            var _this = this;
            if (!this.casting){
                // launch app
                chrome.cast.requestSession(function(e){_this.onRequestSessionSuccess(e)}, function(){_this.onLaunchError()});
            }else{
                // stop casting
                this.stopMedia();
                this.stopApp()
            }
        },

        onRequestSessionSuccess: function(e) {
            mw.log("ChromeCast::session success: " + e.sessionId);
            this.session = e;
            this.getComponent().css("color","#6298f5");
            this.getComponent().attr( 'title', this.stopCastTitle )
            this.casting = true;
            this.loadMedia();
        },

        onLaunchError: function() {
            mw.log("ChromeCast::launch error");
        },

        initializeCastApi: function() {
            var _this = this;
            var sessionRequest = new chrome.cast.SessionRequest(this.applicationID); // 'Castv2Player'
            var apiConfig = new chrome.cast.ApiConfig(sessionRequest, function(event){_this.sessionListener(event)}, function(event){_this.receiverListener(event)});
            chrome.cast.initialize(apiConfig, function(){_this.onInitSuccess()}, function(){_this.onError()});
        },

        sessionListener: function(e) {
            mw.log('ChromeCast::New session ID: ' + e.sessionId);

            this.session = e;
            if (this.session.media.length != 0) {
                mw.log('ChromeCast::Found ' + this.session.media.length + ' existing media sessions.');
                this.onMediaDiscovered('onRequestSessionSuccess_', this.session.media[0]);
            }
            this.session.addMediaListener(
                this.onMediaDiscovered.bind(this, 'addMediaListener'));
            this.session.addUpdateListener(this.sessionUpdateListener.bind(this));
        },

        onMediaDiscovered: function(how, mediaSession) {
            mw.log("ChromeCast::new media session ID:" + mediaSession.mediaSessionId + ' (' + how + ')');
            this.currentMediaSession = mediaSession;
            var _this = this;
            mediaSession.addUpdateListener(function(e){_this.onMediaStatusUpdate(e)});
            this.mediaCurrentTime = this.currentMediaSession.currentTime;

            // switch to Chromecast player
            var chromeCastSource = this.getChromecastSource();
            if (chromeCastSource){
                // select Chromecast player
                this.embedPlayer.selectPlayer( mw.EmbedTypes.getChroemcastPlayer() );
                this.embedPlayer.disablePlayer();
                this.embedPlayer.updatePlaybackInterface();
                // set source using a timeout to avoid setting auto source by Akamai Analytics
                setTimeout(function(){
                    _this.embedPlayer.mediaElement.setSource(chromeCastSource);
                    _this.addBindings();
                },300);


                //this.playMedia();
            }
            //playpauseresume.innerHTML = 'Play';
            //document.getElementById("casticon").src = 'images/cast_icon_active.png';
        },

        playMedia: function() {
            if( !this.currentMediaSession )
                return;
            this.currentMediaSession.play(null, this.mediaCommandSuccessCallback.bind(this,"playing started for " + this.currentMediaSession.sessionId), this.onError);
            $( this.embedPlayer ).trigger( 'onPlayerStateChange', [ "pause" ] );
        },

        pauseMedia: function(){
            if( !this.currentMediaSession )
                return;
            this.currentMediaSession.pause(null, this.mediaCommandSuccessCallback.bind(this,"paused " + this.currentMediaSession.sessionId), this.onError);
        },

        getCurrentTime: function(){
            this.mediaCurrentTime+=0.1;
            return this.mediaCurrentTime;
        },

        setVolume: function(e, percent){
            if( !this.currentMediaSession )
                return;

            var volume = new chrome.cast.Volume();
            volume.level = percent;
            volume.muted = (percent == 0);
            var request = new chrome.cast.media.VolumeRequest();
            request.volume = volume;
            this.currentMediaSession.setVolume(request, this.mediaCommandSuccessCallback.bind(this, 'media set-volume done'), this.onError);
        },

        mediaCommandSuccessCallback: function(info) {
            mw.log('ChromeCast::' + info);
        },

        sessionUpdateListener: function(isAlive) {
            var message = isAlive ? 'ChromeCast::Session Updated' : 'Session Removed';
            message += ': ' + this.session.sessionId;
            mw.log(message);
            if (!isAlive) {
                this.session = null;
            }
        },

        onMediaStatusUpdate: function(isAlive) {
            //if( this.progressFlag ) {
                //document.getElementById("progress").value = parseInt(100 * currentMediaSession.currentTime / currentMediaSession.media.duration);
            //}
            //console.log("onMediaStatusUpdate: "+this.currentMediaSession.currentTime);
            //document.getElementById("playerstate").innerHTML = currentMediaSession.playerState;
        },

        loadMedia: function() {
            var _this = this;
            if (!this.session) {
                mw.log("ChromeCast::no session");
                return;
            }
            var entryInfo = this.embedPlayer.getSource();
            var currentMediaURL = entryInfo.src;
            var mimeType = entryInfo.mimeType;

            mw.log("ChromeCast::loading..." + currentMediaURL);
            var mediaInfo = new chrome.cast.media.MediaInfo(currentMediaURL);
            mediaInfo.contentType = mimeType;
            this.request = new chrome.cast.media.LoadRequest(mediaInfo);
            this.request.autoplay = false;
            this.request.currentTime = 0;
/*
            var payload = {
                "title:" : mediaTitles[i],
                "thumb" : mediaThumbs[i]
            };

            var json = {
                "payload" : payload
            };

            this.request.customData = json;*/

            this.session.loadMedia(this.request,
                _this.onMediaDiscovered.bind(this, 'loadMedia'),
                _this.onMediaError);

        },

        stopMedia: function() {
            if( !this.currentMediaSession )
                return;

            this.currentMediaSession.stop(null, this.mediaCommandSuccessCallback.bind(this,"stopped " + this.currentMediaSession.sessionId), this.onError);
            //var playpauseresume = document.getElementById("playpauseresume");
            //playpauseresume.innerHTML = 'Play';
            mw.log("ChromeCast::media stopped");
        },

        stopApp: function() {
            this.session.stop(this.onStopAppSuccess, this.onError);
            this.getComponent().css("color","white");
            this.getComponent().attr( 'title', this.startCastTitle )
            this.casting = false;
            // restore native player
            this.embedPlayer.selectPlayer( mw.EmbedTypes.getNativePlayerHtml() );
        },

        onStopAppSuccess: function() {
            mw.log('ChromeCast::Session stopped');
        },

        onMediaError: function(e) {
            mw.log("ChromeCast::media error");
            this.getComponent().css("color","red");
        },

        receiverListener: function(e) {
            if( e === 'available' ) {
                mw.log("ChromeCast::receiver found");
            }
            else {
                mw.log("ChromeCast::receiver list empty");
            }
        },

        onInitSuccess: function() {
            mw.log("ChromeCast::init success");
            this.getComponent().removeClass("disabled");
        },

        onError: function() {
            mw.log("ChromeCast::error");
        },

        getChromecastSource: function(){
            // find the best quality MP4 source
            var sources = this.embedPlayer.mediaElement.sources;
            var requiredMimetype = "video/mp4";
            var videoSize = 0;
            var newSource = null;
            for (var i=0; i < sources.length; i++){
                var source = sources[i];
                if (source.mimeType == requiredMimetype && parseInt(source.sizebytes) > videoSize){
                    newSource = source;
                    videoSize = parseInt(newSource.sizebytes);
                }
            }
            if (newSource){
                mw.log("ChromeCast:: getting Chromecast source");
                sources.push(newSource);
                return newSource;
            }else{
                mw.log("ChromeCast:: could not find a source suitable for casting");
                return false;
            }
        }
	}));

} )( window.mw, window.jQuery );