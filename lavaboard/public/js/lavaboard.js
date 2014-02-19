/*jslint sloppy: true, vars: true, white: true */

var lavaboard = (function () {
    "use strict";
    
    var registeredWidgets = {};
    var widgets = [];
    var timeAgoWatchHasBeenStarted = false;
    var gridster;
   
    // private  props/methods
    var createWidget = function (widgetName, opts) {
        if(registeredWidgets[widgetName]){
            var widgetFactory = registeredWidgets[widgetName];
            var widget = widgetFactory.create();
            widget.init(opts);
            return widget;
        }
    };
          
    var forAllWidgets = function(callback){
        for(var i=0; i<widgets.length; i++){
            callback(widgets[i]);           
        } 
    };
    
	var sendEventToAllWidgets = function(eventObj){
        
        var eventArray;
        
        if(typeof eventObj !== 'undefined'){
            if(typeof eventObj.length !== 'undefined' && eventObj.length > 0){
                eventArray = eventObj;
            }else{
                eventArray = [eventObj];
            }            
        }
        
        if(typeof eventArray !== 'undefined'){                     
            for(var i=0; i<eventArray.length; i++){     
                forAllWidgets(function(widget){
                    widget.handleEvent(eventArray[i]);
                });                               
            }
        }        
        
    };
    
    var updateAllWidgets = function(){
        forAllWidgets(function(widget){
            widget.update($('#' + widget.id));
        });       
    };
    
    var initTimeAgoWatch = function(rootEl){
        if(!timeAgoWatchHasBeenStarted){                    
            var update = function(){
                rootEl.find('.timeago').each(function(){
                    var el = $(this);
                    var rel = el.attr('rel');
                    if(rel){
                        var day = moment(parseInt(rel));
                        el.text(day.fromNow());
                    }
                });
            };
            setInterval(update, 60000);
        }
     };
    
    // public props/methods
    var pub = {};	
	pub.registerWidget = function (widget) {
		registeredWidgets[widget.name] = widget;
	};           
    
    pub.init = function (gridsterJqEl, gridsterOpts) {
		//gridster = $(".gridster > ul").gridster({
        //  widget_margins: [5, 5],
        //  widget_base_dimensions: [240, 350]
        //}).data('gridster');
        
        gridster = gridsterJqEl.gridster(gridsterOpts).data('gridster');
        initTimeAgoWatch(gridsterJqEl);
	};
    
    pub.addWidget = function (widgetName, gridX, gridY, opts) {	
        
        var widget = createWidget(widgetName, opts);
        if(widget){
            var id = 'lavaboardwidget-' + widgets.length;
            widget.id = id;
            var classes = 'lbwidget lbwidget'+gridX+'-'+gridY;
            if(opts && opts.class){
                classes = classes + ' ' + opts.class;
            }
            
            var html = '<li id="'+id+'" class="'+classes+'">';
            html = html + widget.buildHtml();
            html = html + '</li>';
            
            gridster.add_widget.apply(gridster, [html, gridX, gridY]); 
            
            widgets.push(widget);
        }           
        
	};
    
    /**
    * Call this after init and all the widget have been added
    */
    pub.start = function(){
        
        // find the millis for the begining of today
        var startOfTodayUnixEpochMillis = moment().startOf('day').valueOf();
                
        // GET THE LATEST EVENTS VIA REST AJAX CALL AND UPDATE
        //var query = {"type":"foobar","namespace":"foobar","timestamp":"foobar"};
        var query = {
            timestamp: {$gt: startOfTodayUnixEpochMillis}
        };                 
        dpd.event.get(query, function (eventArr) {                                 
            sendEventToAllWidgets(eventArr);
            updateAllWidgets();
        });        
        
        // LISTEN TO ALL NEW EVENTS AS THE GET ADDED AND UPDATE
        dpd.on('event.post', function(event) {
            sendEventToAllWidgets(event);
            updateAllWidgets();
        });
        
    };
    
	return pub;
}());


lavaboard.util = {
    startsWith: function(src, query){
        if(typeof src !== 'undefined'){
            return src.slice(0, query.length) == query;
        }
    }
};


lavaboard.registerWidget({
    name:'simpleCountWidget',
    create: function(){
        return {
            init: function(opts){
                
                var defaults = {title:'title'};                
                this.opts = $.extend(defaults, opts); 
                
                this.data = {count:0};
            },
            buildHtml: function(){
                // return html for widget
                var h = '<div class="simpleCountWidget">';
                h = h + '<h2>'+this.opts.title+'</h2>';
                h = h + '<h3>0</h3>';
                h = h + '<div>';
                return h;
            },
            update: function(rootEl){
                // given the rootEl jQuery obj for this widget
                // update the UI for this widget
                rootEl.find('h3').text(this.data.count);
            },
            handleEvent: function(event){                                
                if(typeof this.opts.startsWith !== 'undefined'){
                    if(lavaboard.util.startsWith(event.namespace, this.opts.startsWith)){
                        this.data.count++;
                    }
                }else{
                    this.data.count++;
                }                
            }
        };
    }    
});


lavaboard.registerWidget({
    name:'eventListWidget',
    create: function(){
        return {
            init: function(opts){
                
                var defaults = {title:'title', limit:11, eventMap:{}};                
                this.opts = $.extend(defaults, opts); 
                
                this.data = {recentEvents:[], toAdd:[]};               
            },            
            buildHtml: function(){
                // return html for widget
                var h = '<div class="eventListWidget">';
                h = h + '<h2>'+this.opts.title+'</h2>';
                h = h + '<ul></ul>';
                h = h + '</div>';
                return h;
            },
            update: function(rootEl){
                // given the rootEl jQuery obj for this widget
                // update the UI for this widget              
                var ul = rootEl.find('ul');
                
                var toAdd = this.data.toAdd;
                this.data.toAdd = [];
                
                if(toAdd.length > 0){
                    for(var i=0; i<toAdd.length; i++){
                       this._addLi(toAdd[i], ul);
                    } 
                }                  
            },
            handleEvent: function(event){
                var evtDesc = this.opts.eventMap[event.namespace];
                if(typeof evtDesc === 'undefined'){
                    // not in event map, don't include it
                    return;
                }
                
                if(this.data.toAdd.length > this.opts.limit){                                   
                    // remove first item from array
                    this.data.toAdd.shift();
                }                               
                // add event to the end of the array
                this.data.toAdd.push(event);
            },            
            _addLi: function(event, ul){
                
                var day = moment(event.timestamp);
               
                var evtDesc = this.opts.eventMap[event.namespace];
                var label = event.namespace;
                var icon = '';
                if(evtDesc){
                    label = evtDesc.label;
                    icon = evtDesc.icon;
                }else{
                    // not in event map, don't include it
                    return;
                }
                
                var h = '';                  
                h = h + '<li style="display:none;">';
                h = h +   '<div class="wrap">';
                h = h +     '<div class="i"><i class="'+icon+'"></i></div>';
                h = h +     '<div class="l">';                
                h = h +       label;
                h = h +     '</div>';
                h = h +     '<span class="timeago" rel="'+event.timestamp+'">';
                h = h +       day.fromNow();
                h = h +     '</span>';
                h = h +   '</div>';
                h = h + '</li>';
                
                var li = $(h);
                ul.prepend(li);
                li.show();
                li.addClass('show');
                
                setTimeout(function(){
                    li.find('.wrap').addClass('fadein');
                }, 300);  
                
                var count = ul.children().length;
                
                if(count > this.opts.limit){
                    var lastChild = ul.children().last();
                    lastChild.prev().addClass('last');
                    lastChild.removeClass('show');
                    setTimeout(function(){
                        lastChild.remove();
                    }, 1000);                    
                }
                
            }
        };
    }    
});


