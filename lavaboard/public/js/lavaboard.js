/*jslint sloppy: true, vars: true, white: true */

var lavaboard = (function () {
    "use strict";
    
    var registeredWidgets = {};
    var widgets = [];
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
        
        // GET THE LATEST EVENTS VIA REST AJAX CALL AND UPDATE
        //var query = {"type":"foobar","namespace":"foobar","timestamp":"foobar"};
        var query = {};                 
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
                
                var defaults = {title:'title', limit:10};                
                this.opts = $.extend(defaults, opts); 
                
                this.data = {recentEvents:[]};
            },
            buildHtml: function(){
                // return html for widget
                console.log('buildHtml');
                var h = '<div class="eventListWidget">';
                h = h + '<h2>'+this.opts.title+'</h2>';
                h = h + '<ul>0</ul>';
                h = h + '<div>';
                return h;
            },
            update: function(rootEl){
                 console.log('update');
                // given the rootEl jQuery obj for this widget
                // update the UI for this widget
                //rootEl.find('h3').text(this.data.count);
                var ul = rootEl.find('ul');
                var arr = this.data.recentEvents;
                var h = '';
                
                if(arr.length > 0){
                    for(var i=0; i<arr.length; i++){
                        h = h + '<li>';
                        h = h + arr[i].timestamp;
                        h = h + '<br>';
                        h = h + arr[i].namespace;
                        h = h + '</li>';
                    } 
                }    
                
                ul.empty();
                ul.append(h);
                
            },
            handleEvent: function(event){                
                //console.log('handleEvent - ' + this.id, event);
                //if(typeof this.opts.startsWith !== 'undefined'){
                //    if(lavaboard.util.startsWith(event.namespace, this.opts.startsWith)){
                //        this.data.count++;
                //    }
               // }else{
                //    this.data.count++;
                //}       
                this._addEvent(event);
            },
            _addEvent: function(event){
                if(this.data.recentEvents.length >= this.opts.limit){
                    // remove last item from array
                    this.data.recentEvents.pop();
                }
                // add event to the front of the array
                this.data.recentEvents.unshift(event);
                
                console.log(this.data.recentEvents);
            }
        };
    }    
});


