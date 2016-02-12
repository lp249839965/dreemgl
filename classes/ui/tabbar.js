/* Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
 You may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/
// Sprite class

define.class("$ui/view", function($ui$, view, label, icon){

	this.attributes = {

		// Tab definitions.  This can be a simple list of strings or and array of more complicated
		// objects that describe tab behavior in detail.
		tabs:Config({type:Array, value:[]}),

		// Color of default tabs, can be overridden in style
		tabcolor: Config({value:vec4(0,0,0,1), meta:"color" }),

		// Default tab states if none provided in the tab defintions.
		states:Config({type:Object, value:{
			normal:{
				fgcolor:"#aaa",
				on:undefined
			},
			hover:{
				fgcolor:"#eee",
				on:undefined
			},
			active:{
				fgcolor:"#fff",
				on:undefined
			},
			selected:{
				fgcolor:"yellow",
				on:function(tab) {
					if (tab.parent.__selected) {
						tab.parent.__selected.state = "normal";
					}
					tab.parent.__selected = tab;
				}
			},
			disabled:{
				fgcolor:"darkgray",
				on:undefined
			}}
		})
	};

	this.tooldragroot = true;
	this.flexdirection = "row";
	this.bgcolor = NaN;

	this.style = {
		tab: {
			flex: 1,
			bgcolor:this.tabcolor
		},
	    tab_folder: {
			y:1,
			flex: 0,
			bgcolor:this.tabcolor,
			borderradius: vec4(15,15,0,0)
		}
	};

	this.render = function() {
		var tabs = [];
		var i,tab;
		if (this.constructor_children) {
			for (i=0;i<this.constructor_children.length;i++) {
				tab = this.constructor_children[i];
				tabs.push(tab);
			}
		}

		if (this.tabs) {
			for (i=0;i<this.tabs.length;i++) {
				var tabdef = this.tabs[i];

				var tab;
				if (typeof(tabdef) === "string") {
					tab = this.tab({ label:tabdef })
				} else {
					tab = this.tab(tabdef)
				}

				tabs.push(tab);
			}
		}

		return tabs;
	};

	define.class(this, "tab", view, function() {
		this.attributes = {

			// Image that floats inside the tab (as opposed to a bgimage).
			image:Config({type:String}),

			// Foreground color of any label or icon text.
			fgcolor: Config({value:vec4(1,1,1,1), meta:"color" }),

			// Text to display in tab.
			label:Config({type:String}),

			// Icon to display in tab.
			icon:Config({type:String}),

			// Tab display state.  Changing this can have side effects if `on` functions are provided
			state:Config({type:Enum("normal", "hover", "active", "selected", "disabled"), value:"normal"}),

			// Configuration for normal state
			normal:Config({type:Object}),

			// Configuration for active/pressed state
			active:Config({type:Object}),

			// Configuration for hover state
			hover:Config({type:Object}),

			// Configuration for selected state
			selected:Config({type:Object}),

			// Configuration for disabled state
			disabled:Config({type:Object})
		};

		this.justifycontent = "center";
		this.alignitems = "center";

		this.init = function() {
			this.onstate(null, this.state, this);
		};

		this.onstate = function(ev,v,o) {

			var defaultstates = this.outer.states || {};
			var defaultstate = defaultstates[v] || {};
			var state = this[v] || defaultstate;

			var keys = [];

			for (var skey in state) {
				if (state.hasOwnProperty(skey)) {
					if (keys.indexOf(skey) < 0) {
						keys.push(skey);
					}
				}
			}

			for (var dkey in defaultstate) {
				if (defaultstate.hasOwnProperty(dkey)) {
					if (keys.indexOf(dkey) < 0) {
						keys.push(dkey);
					}
				}
			}

			for (var i=0;i<keys.length;i++) {
				var key = keys[i];
				var val = state[key];
				if (typeof(val) === "undefined") {
					val = defaultstate[key];
				}
				//console.log('setting property', key, 'to', val, 'for state', v);
				this[key] = val;
			}

			if (this.on) {
				this.on(this, v);
			}
		};

		this.pointerstart = function(ev) {
			if (this.state !== "disabled") {
				this.state = "active";
			}
		};
		this.pointerhover = function(ev) {
			if (this.state === "normal") {
				this.state = "hover";
			}
		};
		this.pointerout = function(ev) {
			if (this.state === "hover") {
				this.state = "normal";
			}
		};
		this.pointerend = function(ev) {
			if (this.state === "active") {
				this.state = "selected";
			}
		};

		this.render = function() {
			var views = [];

			if (this.icon) {
				views.push(icon({
					fgcolor:this.fgcolor,
					drawtarget:"color",
					icon:this.icon,
					padding:5,
					bgcolor:NaN
				}))
			}

			if (this.image) {
				views.push(view({
					bgimage:this.image,
					drawtarget:"color",
					padding:5,
					bgcolor:NaN
				}))
			}

			if (this.label) {
				views.push(label({
					fgcolor:this.fgcolor,
					drawtarget:"color",
					text:this.label,
					padding:5,
					bgcolor:NaN
				}))
			}

			return views;
		};
	});

	var tabbar = this.constructor;
	this.constructor.examples = {
		Usage: function() {
			return [
				tabbar({tabs:[
					{
						normal:{
							icon:"flask",
							fgcolor:"gray"
						},
						hover:{
							fgcolor:"lightblue"
						},
						active:{
							fgcolor:"lightgreen"
						},
						selected:{
							fgcolor:"red"
						},
						disabled:{
							fgcolor:"pink"
						}
					},
					{
						label:"two",
						state:"disabled",
						disabled:{
							bgcolor:"gray",
							fgcolor:"darkgray"
						}
					},
					"tree"
				]})
			]
		}
	}
});