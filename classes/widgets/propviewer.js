/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  
   You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing, 
   software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, 
   either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


define.class(function(require, $ui$, foldcontainer, view, label, button, scrollbar, textbox,$widgets$,propeditor){
	this.attributes = {
		target:{type:String,value:""}
		
	}
	
	this.flexdirection= "column";
	this.margin = vec4(4);
	this.bgcolor = vec4(1,1,1,0.83);
	this.borderradius = 4;
	this.padding = 5
	this.render = function(){
		var c = this.find(this.target);
		if (!c) return [];
		
			
		var res = [];
		var keysgroups = {};
		
		for(key in c._attributes){
			var attr = c._attributes[key];
			var typename = attr.type? attr.type.name:"NONE";
			if (typename != "NONE" && typename != "Event" )
			{
				if (!keysgroups[attr.group]) keysgroups[attr.group] = [];
				keysgroups[attr.group].push(key);
			}
		}
		for(var group in keysgroups){
			var groupcontent = [];
			keys = keysgroups[group];
			
			keys.sort();			
			
			for(var i = 0 ;i<keys.length;i++){
				var key = keys[i];
				var attr = c._attributes[key];	
				//console.log(attr);			
				groupcontent.push(propeditor({property:attr, propertyname: key}))
			}
			res.push(foldcontainer({title: group}, view({flexdirection:"column" , flex:1},groupcontent)))
		}
		return res;
	}
})