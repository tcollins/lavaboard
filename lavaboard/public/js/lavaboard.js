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
                        
            var html = '<li id="'+id+'">';
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
        
        for(var i=0; i<widgets.length; i++){
            widgets[i].handleEvent({namespace: 'blah.foo.yea'});
        }
        
        widgets[1].handleEvent({namespace: 'blah.foo.yea'});
        widgets[1].handleEvent({namespace: 'blah.foo.yea'});
        widgets[1].handleEvent({namespace: 'blah.foo.yea'});
        
        for(var i=0; i<widgets.length; i++){
            widgets[i].update($('#' + widgets[i].id));
        }
        
    };
    
	return pub;
}());


lavaboard.registerWidget({
    name:'simpleCountWidget',
    create: function(){
        return {
            init: function(opts){
                this.opt = opts;
                this.data = {count:0};
            },
            buildHtml: function(){
                // return html for widget
                return '<b style="font-size:40px; color:#333;">0</b>';
            },
            update: function(rootEl){
                // given the rootEl jQuery obj for this widget
                // update the UI for this widget
                rootEl.find('b').text(this.data.count);
            },
            handleEvent: function(event){                
                this.data.count++;
            }
        };
    }    
});





