/* Copyright 2015-2016 Teeming Society. Licensed under the Apache License, Version 2.0 (the "License"); DreemGL is a collaboration between Teeming Society & Samsung Electronics, sponsored by Samsung and others.
   You may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
   either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


define.class('$ui/view', function(icon, label){
	// Simple toggle button: a rectangle with a textlabel and an icon

	this.attributes = {
		// The label for the button
		text: Config({type: String, value: ""}),

		icon: Config({type: String, value: "check"}),

		// Font size in device-pixels.
		fontsize: Config({type: float, value: 14}),

		// Gradient color 1
		col1: Config({meta:"color", type: vec4, value: vec4("#404040"), duration: 1.0}),
		// Gradient color 2
		col2: Config({meta:"color", type: vec4, value: vec4("#404040"), duration: 1.0}),

		// Color of the inactive icon
		inactivecolor: Config({meta:"color", type: vec4, value: vec4("#bbb")}),

		// Color of the label text in neutral state
		textcolor: Config({meta:"color", type: vec4, value: vec4("#404040")}),

		// Color of the label text in pressed-down state
		textactivecolor: Config({meta:"color", type: vec4, value: vec4("green")}),

		// First gradient color for the button background in neutral state
		buttoncolor1: Config({meta:"color", type: vec4, value: vec4("#fffff0")}),
		// Second gradient color for the button background in neutral state
		buttoncolor2: Config({meta:"color", type: vec4, value: vec4("#ffffff")}),

		// First gradient color for the button background in hovered state
		hovercolor1: Config({meta:"color", type: vec4, value: vec4("#f0f0f0")}),
		// Second gradient color for the button background in hovered state
		hovercolor2: Config({meta:"color", type: vec4, value: vec4("#f8f8f8")}),

		// First gradient color for the button background in pressed state
		pressedcolor1: Config({meta:"color", type: vec4, value: vec4("#d0d0f0")}),
		// Second gradient color for the button background in pressed state
		pressedcolor2: Config({meta:"color", type: vec4, value: vec4("#d0d0f0")}),

		// fires when button is clicked
		click:Config({type:Event}),
		value:Config({type:Boolean, value:false}),

		bgcolor: '#eee',
		fgcolor: vec4("#404040"),
		buttonres: {},
		padding: 8,
		borderradius: 3,
		borderwidth: 2,
		margin: 4,
		bordercolor: vec4("lightgray"),
		alignItems: "center"
	}

	this.style = {
		icon:{
			fgcolor:Config({motion:'linear', duration:0.1})
		}
	}

	//this.onclick = function(){
	//	this.value  = !(this.value);
	//}

	this.hardrect = {
		color: function(){
			return mix(view.col1, view.col2, (uv.y)/0.8)
		}
	}

	// the hover state when someone hovers over the button
	this.statehover = function(){
		this.col1 = this.hovercolor1
		this.col2 = this.hovercolor2
	}

	// the normal button state
	this.statenormal = function(){
		this.col1 = this.buttoncolor1
		this.col2 = this.buttoncolor2
	}

	// clicked state
	this.stateclick = function(){
		//this.animate({col1:{0:vec4('red'),3:vec4('green')}})
		this.col1 = this.pressedcolor1
		this.col2 = this.pressedcolor2

		this.value  = !(this.value);
	}

	this.init = function(){
		this.statenormal()
	}

	this.pointerover = function(){this.statehover()}
	this.pointerout = function(){this.statenormal()}
	this.pointerstart = function(){this.stateclick()}
	this.pointerend = function(event){
		this.statenormal()
		if (event.isover){
			this.emit('click',event)
		}
	}

	this.flexdirection = 'row'

	this.render = function(){
		var cb = [];

		cb.push(icon({
			fgcolor:(!!(this.value) ? this.fgcolor : this.inactivecolor),
			icon: this.icon,
			fontsize:this.fontsize,
			bgcolor:"transparent",
			drawtarget:"color"
		}));

		if (this.text) {
			cb.push(label({
				bgcolor:NaN,
				drawtarget:"color",
				padding:vec4(10,0,0,0),
				text:this.text,
				fontsize:this.fontsize,
				fgcolor:(!!(this.value) ? this.textactivecolor : this.textcolor)
			}))
		}

		return cb;
	}

	// Basic usage of the button.
	var checkbox = this.constructor
	this.constructor.examples = {
		Usage:function(){
			return [
				checkbox({value:true})
				,checkbox({text:"Colored!", buttoncolor1: "red", buttoncolor2: "blue", textcolor: "white"  })
				,checkbox({text:"With an icon!", icon:"flask" })
			]
		}
	}
})
