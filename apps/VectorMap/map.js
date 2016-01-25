define.class("$ui/view", function(require,$ui$, view,label, $$, geo, urlfetch)
{		
	var KindSet = this.KindSet = {};
	var UnhandledKindSet = this.UnhandledKindSet = {};	
	
	this.attributes = {
		latlong:vec2(52.3608307,   4.8626387),
		zoomlevel: 9
	}
	
	this.landcolor1 = {farm:vec4(1,1,0.1,1), retail:vec4(0,0,1,0.5), tower:"white",library:"white",common:"white", sports_centre:"red", bridge:"gray", university:"red", breakwater:"blue", playground:"lime",forest:"darkgreen",pitch:"lime", grass:"lime", village_green:"green", garden:"green",residential:"gray" , footway:"gray", pedestrian:"gray", water:"#40a0ff",pedestrian:"lightgray", parking:"gray", park:"lime", earth:"lime", pier:"#404040", "rail" : vec4("purple"), "minor_road": vec4("orange"), "major_road" : vec4("red"), highway:vec4("black")}
	this.landcolor2 = {farm:vec4(1,1,0.1,1), retail:vec4(0,0,1,0.5), tower:"gray", library:"gray", common:"gray", sports_centre:"white", bridge:"white", university:"black", breakwater:"green", playground:"red", forest:"black",pitch:"green", grass:"green", village_green:"green", garden:"#40d080", residential:"lightgray" , footway:"yellow", pedestrian:"blue",water:"#f0ffff",pedestrian:"yellow", parking:"lightgray", park:"yellow", earth:"green", pier:"gray", "rail" : vec4("purple"), "minor_road": vec4("orange"), "major_road" : vec4("red"), highway:vec4("black")}
	this.landoffsets = {
		retail:27, 
		tower:26, 
		library:25, 
		common:24, 
		sports_centre:-23, 
		bridge:-22, 
		university:-21, 
		breakwater:-20, 
		playground:-19, 
		forest:-18,
		pitch:-17, 
		grass:-16, 
		village_green:-15, 
		garden:-14, 
		residential:-13, 
		footway:-12, 
		pedestrian:-11,
		water:-5,
		pedestrian:-9, 
		parking:-8, 
		park:-7, 
		earth:10, 
		pier:-5, 
		rail : -4,
		minor_road:-55, 
		major_road :-55, highway:-55
	}
	
	this.mouseleftdown = function(){
		console.log("mousedown");
		
		this.mousemove = function(){
			console.log("dragging");
		}
	}
	
	this.mouseleftup = function(){
		console.log("up!");
		this.mousemove = function(){};
	}
	
	var earcut = require('$system/lib/earcut-port.js')().earcut;
	
	this.gotoCity = function(city, zoomlevel){
		this.dataset.gotoCity(city, zoomlevel);
	}
	
	var BuildingVertexStruct = define.struct({		
		pos:vec3,
		color:vec4, 
		id: float,
		buildingid: float
	})
	
	var RoadVertexStruct = define.struct({		
		pos:vec3,
		color:vec4,
		side: float, 
		dist: float,
		linewidth:float,
		sidevec:vec2, 
		markcolor: vec4
	})
	
	var LandVertexStruct = define.struct({
		pos:vec3,
		color1:vec4,
		color2:vec4, 
		id: float
	})
	
	function arctotriangles(arc){
		if (!arc) return []
		var verts = []
		var flatverts = []
		var A0 = arc[0]
		var nx = A0[0]
		var ny = A0[1]

		flatverts.push(nx)
		flatverts.push(ny)
		
		for (var i = 1; i < arc.length; i++){
			var A = arc[i]
			nx += A[0]
			ny += A[1]
			flatverts.push(nx)
			flatverts.push(ny)
		}
		
		var triangles = earcut(flatverts)
		
		for(var i = 0; i < triangles.length; i++){
			idx = triangles[i]
			verts.push(vec2(flatverts[idx * 2], flatverts[idx * 2 + 1]))
		}

		return verts
	}

	
	function buildBuildingVertexBuffer(buildings){
		var mesh = BuildingVertexStruct.array();
		
		for(var i = 0;i<buildings.length;i++){
			var building = buildings[i];
			
			var theH = building.h;
			var isofac = 0 
			var isox = (theH*0.5)*isofac
			var isoy = (theH)*isofac
				
			if (building.arcs)
			for(var j = 0;j<building.arcs.length;j++){
				var arc = building.arcs[j];
				var tris = arctotriangles(arc);
				var A1 = vec2(arc[0][0], arc[0][1])
				var OA1 = A1;
				var c = 0.3;
				for(var a = 1;a<arc.length+1;a++)
				{
					var ca = arc[a%arc.length];
					
					var A2 = vec2(A1[0] + ca[0], A1[1] + ca[1]);
					if (a  == arc.length){
						A2[1] -= OA1[1];
						A2[0] -= OA1[0];
					}
					
					c = 0.4 + 0.3 *Math.sin(Math.atan2(A2[1]-A1[1], A2[0]-A1[0]));
					
					mesh.push(A1[0],A1[1],0, c,c,c, 1, i,building.id);
					mesh.push(A2[0],A2[1],0, c,c,c, 1, i,building.id);
					mesh.push(A2[0]+isox,A2[1]+isoy,theH, c,c,c, 1, i,building.id);
					mesh.push(A1[0],A1[1],0, c,c,c, 1, i,building.id);
					mesh.push(A2[0]+isox,A2[1]+isoy,theH, c,c,c, 1, i,building.id);
					mesh.push(A1[0]+isox,A1[1]+isoy,theH, c,c,c, 1, i,building.id);
					A1 = A2;
			
				}
				c = 0.4
				for(var a = 0;a<tris.length;a++){
					mesh.push(tris[a][0]+isox,tris[a][1]+isoy,theH, c,c,c, 1, i,building.id);
				}
			}							
		}
		return mesh;
	}
	
	function buildAreaPolygonVertexBuffer(areas){
		for(var i = 0;i<areas.length;i++){
			var off = 0;
			var land = areas.lands[i];
			
			var color1 = vec4("black");
			var color2 = vec4("black");
			
			if (this.landcolor1[land.kind]) color1 = this.landcolor1[land.kind];else UnhandledKindSet[land.kind] = true;
			if (this.landcolor2[land.kind]) color2 = this.landcolor2[land.kind];else UnhandledKindSet[land.kind] = true;
			if (this.landoffsets[land.kind]) off = this.landoffsets[land.kind];
			
			if (land.arcs){
				for(var j = 0;j<land.arcs.length;j++){
					var arc = land.arcs[j];
					var tris = arctotriangles(arc);
					for(var a = 0;a<tris.length;a++){
						this.mesh.push(tris[a],off, vec4(color1), vec4(color2), i);
					}
				}
			}
		}
	}

	function buildRoadPolygonVertexBuffer(roads){
		
	}

	define.class(this, "building", function($ui$, view){
		
		this.attributes = {
			buildings: [],
			scalefactor: 1.0,
			currentbuilding: -1,
			currentbuildingid: -1,
			vertexbuffer: []
		}

		this.boundscheck = false
		
		this.onbuildings = function(){
			this.pickrange = this.buildings.length
			//console.log("setting pickrange:", this.pickrange);
		}
		
		this.mouseout = function(){
			this.currentbuilding = -1;
			this.currentbuildingid = -1;
		}

		this.mouseover =  function(){
			var building = this.buildings[this.last_pick_id]
			this.currentbuilding = this.last_pick_id
			if(building){
				this.currentbuildingid = building.id;
				console.log(this.currentbuildingid, building.id, building);
				
				var text = "Building"
				//console.log(building);
				if(building.kind) text += " " + building.kind
				if(building.name) text += " " + building.name
				if(building.street) text += " " + building.street
				if(building.housenumber) text += " " + building.housenumber
				this.screen.status = text
			}
			else {
				this.currentbuildingid = -1;
			
				console.log(this.last_pick_id)
			}
		}
		
		this.bg = function(){
			
			this.vertexstruct =  BuildingVertexStruct;

			this.mesh = this.vertexstruct.array();
			this.color = function(){

				PickGuid = mesh.id;
				if (abs(view.currentbuilding - mesh.id)<0.2) return vec4(mesh.color.x, 0, 0, 1);
				if (abs(view.currentbuildingid - mesh.buildingid)<0.2) return vec4(mesh.color.x * 0.8, 0, 0, 1);
				//return pal.pal1(mesh.pos.z/300.-0.1*view.time +mesh.id/100.) * mesh.color
				return mesh.color;
			}
	
			this.update = function(){
				this.mesh = this.view.vertexbuffer;
				
				
			}
			
			this.position = function(){					
				return vec4(mesh.pos.x, 1000-mesh.pos.y, mesh.pos.z, 1) * view.totalmatrix * view.viewmatrix
			}
			
			this.drawtype = this.TRIANGLES
			this.linewidth = 4
		
		}
	})
				
	define.class(this, "land", function($ui$, view){
		this.boundscheck = false
		
		this.attributes = {
			lands:[],
			currentland: -1,
			vertexbuffer: []
		}
		
		this.mouseover =  function(evt){
			//console.log(this.last_pick_id)
			this.currentland = this.last_pick_id ;
			var text = "Land: " + this.lands[this.last_pick_id ].kind;
			this.screen.status = text;				
		}	
		
		this.mouseout = function(){
			this.currentland = -1;
		}
		
		this.onlands = function(){
			this.pickrange = this.lands.length;
		}
		
		this.bg = function(){
						
			
			this.vertexstruct =  LandVertexStruct;
			
			
			this.mesh = this.vertexstruct.array();
			
			this.color = function(){						
				var xy = vec2(mesh.pos.xy)*0.2
				//var n1 = (noise.noise2d(xy))*0.25 + 0.25;
				//var n2 = 0.8*noise.noise2d(xy*2.3)
				var themix = 0.5
				PickGuid = mesh.id
				if (abs(view.currentland - mesh.id)<0.2) return "red";
				//mod(mesh.id, 256.)
				//PickGuid.y = floor(mesh.id/256.)
				return mix(mesh.color1, mesh.color2,themix);						
			}
	
			this.update = function(){
				this.mesh = this.view.vertexbuffer;
				
			}
			
			this.position = function(){					
				var r = vec4(mesh.pos.x, 1000-mesh.pos.y, 0, 1) * view.totalmatrix * view.viewmatrix;
				r.w -= mesh.pos.z*0.01;
				return r
			}
				
			this.drawtype = this.TRIANGLES
			this.linewidth = 4
		}
	})
	
	define.class(this, "road", function($ui$, view){
		this.boundscheck = false;
		
		this.attributes = {					
			roads:[],
			zoomlevel: 16,
			zoomscale: 2.0
		}
		this.bg = function(){		
			this.vertexstruct =  RoadVertexStruct
			
			this.mesh = this.vertexstruct.array();
			
			this.color = function(){
				if (abs(mesh.side) > 0.85) return mix("black", mesh.color, 0.8)
				return mesh.color;
			}
			
			this.widths = {water:20, path:2,ferry:4, "rail" : 4, "minor_road": 8, "major_road" : 12, path: 3, highway:12}
			this.colors = {water:"#30a0ff", path:"#d0d0d0", ferry:"lightblue", "rail" : vec4("purple"), "minor_road": vec4("#505050"), "major_road" : vec4("#404040"), highway:vec4("#303030")}
			this.markcolors = {water:"#30a0ff", major_road:"white", minor_road:"#a0a0a0"}
		
			this.update = function(){
				//console.log("updating");
				this.mesh = this.vertexstruct.array();
				var 	z = 0.1;

				for (var i = 0;i<this.view.roads.length;i++){							
					
					
	//						console.log(z);
					var R = this.view.roads[i];
					//console.log(R);
					var linewidth = 3;
					var color = vec4("gray") ;
					if (this.widths[R.kind]) linewidth = this.widths[R.kind];
					if (this.colors[R.kind]) color = vec4(this.colors[R.kind]);
					var markcolor = color;
					if (this.markcolors[R.kind]) markcolor = vec4(this.markcolors[R.kind]);
				
				//	linewidth *= Math.pow(2, this.view.zoomlevel-14);
					
					for(var rr = 0;rr<R.arcs.length;rr++){
						
						//z+=10 ;
					
						var currentarc = R.arcs[rr]
						if (currentarc.length == 1){
							continue
						}
						//	console.log(R, currentarc, currentarc.length, currentarc[0].length);
						
						//console.log(R, currentarc);
						//continue;
						var A0 = currentarc[0];
						var A1 = vec2(currentarc[1][0]+A0[0],currentarc[1][1]+A0[1]) ;
						
						//this.mesh.push(A0[0], A0[1], this.view.color);
						var nx = A0[0];
						var ny = A0[1];
						
						var odx = A1[0]-A0[0];
						var ody = A1[1]-A0[1];
						
						var predelta = vec2.normalize(vec2(odx, ody));
						var presdelta = vec2.rotate(predelta, 3.1415/2.0);
					
					
					
						var dist = 0;
						var dist2 = 0;
						var lastsdelta = vec2(0,0);
					//	color = vec4("blue");
						this.mesh.push(nx,ny,z, color, 1, dist,linewidth,presdelta, markcolor);
						this.mesh.push(nx,ny,z, color, -1, dist,linewidth,presdelta, markcolor);

						this.mesh.push(nx - predelta[0]*linewidth*0.5,ny - predelta[1]*linewidth*0.5,z, color, 0.5, -10 ,linewidth,presdelta, markcolor);

						this.mesh.push(nx - predelta[0]*linewidth*0.5,ny - predelta[1]*linewidth*0.5,z, color, 0.5, -10 ,linewidth,presdelta, markcolor);
						this.mesh.push(nx - predelta[0]*linewidth*0.5,ny - predelta[1]*linewidth*0.5,z, color, -0.5, -10 ,linewidth,presdelta, markcolor);

						//this.mesh.push(nx,ny, color, 1, dist,linewidth,presdelta, markcolor);
						this.mesh.push(nx,ny, z, color, -1, dist,linewidth,presdelta, markcolor);


					//	color = vec4(0,0,0.03,0.1)
					var lastdelta = vec2(0);
						for(var a = 1;a<currentarc.length;a++){					
							var A =currentarc[a];
							
							var tnx = nx + A[0];
							var tny = ny + A[1];
							var predelt = vec2( tnx - nx, tny - ny);
							var delta = vec2.normalize(predelt);
							var sdelta = vec2.rotate(delta, PI/2);
					
							var dist2 = dist +  vec2.len(predelt);
							
							if (a>1){
								this.mesh.push(nx,ny,z, color, 1, dist,linewidth,lastsdelta, markcolor);
								this.mesh.push(nx,ny,z, color, 1, dist,linewidth,sdelta, markcolor);
								this.mesh.push(nx,ny,z, color, -1, dist,linewidth,sdelta, markcolor);
								
								this.mesh.push(nx,ny,z, color, 1, dist,linewidth,lastsdelta, markcolor);
								this.mesh.push(nx,ny,z, color,-1, dist,linewidth,sdelta, markcolor);
								this.mesh.push(nx,ny,z, color, -1, dist,linewidth,lastsdelta, markcolor);
									
							}
							//color = vec4(0,1,0,0.2)
							this.mesh.push( nx, ny,z,color, 1, dist ,linewidth, sdelta, markcolor);
							this.mesh.push( nx, ny,z,color,-1, dist ,linewidth, sdelta, markcolor);
							this.mesh.push(tnx,tny,z,color, 1, dist2,linewidth, sdelta, markcolor);
							
							this.mesh.push(nx,ny,z,color,-1, dist,linewidth, sdelta, markcolor);
							this.mesh.push(tnx,tny,z,color,1,dist2,linewidth, sdelta, markcolor);
							this.mesh.push(tnx,tny,z,color,-1, dist2,linewidth, sdelta, markcolor);
							
							lastsdelta = vec2(sdelta[0], sdelta[1]);
							dist = dist2;									
							nx = tnx;
							ny = tny;
							lastdelta = delta;
						}
						//color = vec4("red");
						this.mesh.push(nx,ny,z, color, 1, dist,linewidth,lastsdelta, markcolor);
						this.mesh.push(nx,ny,z, color, -1, dist,linewidth,lastsdelta, markcolor);
						this.mesh.push(nx + lastdelta[0]*linewidth*0.5,ny + lastdelta[1]*linewidth*0.5,z, color, 0.5, dist+linewidth*0.5 ,linewidth,lastsdelta, markcolor);

						this.mesh.push(nx + lastdelta[0]*linewidth*0.5,ny + lastdelta[1]*linewidth*0.5,z, color, 0.5, dist+linewidth*0.5 ,linewidth,lastsdelta, markcolor);
						this.mesh.push(nx + lastdelta[0]*linewidth*0.5,ny + lastdelta[1]*linewidth*0.5,z, color, -0.5, dist+linewidth*0.5,linewidth,lastsdelta, markcolor);
						this.mesh.push(nx,ny, z,color, -1, dist,linewidth,presdelta, markcolor);

					}
				}
			}
			
			this.position = function(){					
				var pos = mesh.pos.xy + mesh.sidevec * mesh.side * view.zoomscale*mesh.linewidth*0.5;
				var res = vec4(pos.x, 1000-pos.y, 0, 1.0) * view.totalmatrix * view.viewmatrix;
				res.w += mesh.pos.z;
				return res
			}
			
			this.drawtype = this.TRIANGLES
			this.linewidth = 4;				
		}
	})
		
	define.class(this, "mapdataset", "$system/base/node", function( $$, geo)
	{
		this.requestPending = false;
		this.loadqueue = [];
		this.loadqueuehash = [];
		this.loadedblocks = {};
		var geo = this.geo = geo();
		
		this.attributes = {
			centerx: 0,
			centery: 0,
			latlong:vec2(52.3608307,   4.8626387),
			zoomlevel: 9
		}
		
		this.setCenterLatLng = function(lat, lng, zoom){	
			zoom = Math.floor(zoom);
			var llm = geo.latLngToMeters(lat, lng)
			var tvm = geo.tileForMeters(llm[0], llm[1], zoom);
			this.setCenter(tvm.x, tvm.y, zoom);
		}
		
		this.setCenter = function(x,y,z){
			this.centerx = x;
			this.centery = y;
			this.centerz = z;
			
			for(var xx = -3; xx < 3; xx++){
				for(var yy = -3; yy < 3; yy++){			
					this.addToQueue(x + xx,y + yy,z);	
				}
			}					
		}
		
		this.createHash = function(x, y, z){
			return x + "_" + y + "_" + z;
		}

		this.addToQueue = function(x, y, z){		
			var hash = this.createHash(x, y, z);
			if (this.loadqueuehash[hash]) return; // already queued for load.
			if (this.loadedblocks[hash]) return; // already loaded.
			
			this.loadqueuehash[hash] = 1;
			this.loadqueue.push({x:x, y:y, z:z});
			this.updateLoadQueue();
		}

		this.processLoadedBlock = function(x, y, z, data){
			var hash = this.createHash(x,y,z);
			this.loadedblocks[hash] = {x:x, y:y, z:z, blockdata:data};
		}
		
		this.simulateLoaded = function(){
			if (this.currentRequest) {
				
				var r = this.currentRequest;
				var hash = this.createHash(r.x, r.y, r.z);
				this.loadedblocks[hash] = this.currentRequest
				this.loadqueuehash[hash] =  undefined;
				this.currentRequest = undefined;
				this.cleanLoadedBlocks();
				this.updateLoadQueue();
	//			this.find("tiledmap").datasource = this;
			}		
		}
		
		this.cleanLoadedBlocks = function(){
			var keys = Object.keys(this.loadedblocks);
			
			for(var i =0 ;i<keys.length;i++)
			{
				var lb = this.loadedblocks[keys[i]]
				var dx = lb.x - this.centerx;
				var dy = lb.y - this.centery;
				var dz = (lb.z - this.centerz)*5;
				var dist  = dx*dx + dy*dy + dz*dz;
				if (dist > 5*5*5) {
					delete this.loadedblocks[keys[i]];
				}
			}
			
		//	this.find("tiledmap").datasource = this;		
		}
		
		this.loadstring = function(str){
			if (this.currentRequest) {
				
				try{
					this.thedata = JSON.parse(str);	
				}
				catch(e){
					console.log(e, str);
				}
					var Bset = [];
					var Rset = [];
					var Wset = [];
					var Eset = [];
					var Lset = [];
					
					for (var i = 0;i<this.thedata.objects.buildings.geometries.length;i++){
						var Bb = this.thedata.objects.buildings.geometries[i];
					//	console.log(Bb.properties);
						var B = {id:Bb.properties.id,h:Bb.properties.height?Bb.properties.height:3.0,kind:Bb.properties.kind, name:Bb.properties.name, street: Bb.properties["addr_street"], housenumber: Bb.properties.addr_housenumber, arcs:[]};
							if (Bb.arcs){
								for(var k = 0;k<Bb.arcs.length;k++){
								B.arcs.push(this.thedata.arcs[Bb.arcs[k]]);
							}
						}
						KindSet[B.kind] = true;
						Bset.push(B);
					}
					
					for (var i = 0;i<this.thedata.objects.water.geometries.length;i++){
						var Bb = this.thedata.objects.water.geometries[i];
						var B = {arcs:[], kind:"water" };
						//console.log(Bb);
						if(Bb.arcs)
							if (Bb.type == "MultiLineString"){
								var arc = [];
								for(var k = 0;k<Bb.arcs.length;k++){
									var sourcearc = this.thedata.arcs[Bb.arcs[k]];
									var x = sourcearc[0][0];
									var y = sourcearc[0][1];
									arc.push(x,y);
									for(var l = 1;l<sourcearc.length;l++)
									{
//										console.log(l, sourcearc[l]);
										x+= sourcearc[l][0];
										y+= sourcearc[l][1];
										arc.push(x,y);
	//									arc.push(sourcearc[l]);
									}
								}
								B.arcs.push(arc);
							}
							else
							for(var k = 0; k < Bb.arcs.length;k++){
								B.arcs.push(this.thedata.arcs[Bb.arcs[k]]);
							
						}
						if (Bb.type == "LineString" ){
							//Rset.push(B);
						}
						else{
							Wset.push(B);
						}
					}
					
					for (var i = 0;i<this.thedata.objects.earth.geometries.length;i++){
						var Bb = this.thedata.objects.earth.geometries[i];
						var B = {arcs:[], kind:"earth"};
							for(var k = 0;k<Bb.arcs.length;k++){
								B.arcs.push(this.thedata.arcs[Bb.arcs[k]]);
							
						}
						KindSet[B.kind] = true;
						Eset.push(B);
					}
					
					for (var i = 0;i<this.thedata.objects.landuse.geometries.length;i++){
						var Bb = this.thedata.objects.landuse.geometries[i];
						var B = {arcs:[], kind:Bb.properties.kind, name:Bb.properties.name};
								if (Bb.arcs)
						for(var k = 0;k<Bb.arcs.length;k++){
								B.arcs.push(this.thedata.arcs[Bb.arcs[k]]);
							
						}
						KindSet[B.kind] = true;
						Lset.push(B);
					}
					
					for (var i = 0;i<this.thedata.objects.roads.geometries.length;i++){
						var Bb = this.thedata.objects.roads.geometries[i];
						var B = { arcs:[], kind: Bb.properties.kind};						
							for(var k = 0;k<Bb.arcs.length;k++){
								B.arcs.push(this.thedata.arcs[Bb.arcs[k]]);	
							}
							Rset.push(B);
						KindSet[B.kind] = true;
						
						
					}		
					
					for (var i = 0;i<this.thedata.objects.transit.geometries.length;i++){
						var Bb = this.thedata.objects.transit.geometries[i];
						var B = { arcs:[]};
						
						for(var k = 0;k<Bb.arcs.length;k++){
							B.arcs.push(this.thedata.arcs[Bb.arcs[k]]);	
						}
						KindSet[B.kind] = true;
						//Rset.push(B);
					}
					
				var r = this.currentRequest;
				

				r.buildings = Bset;
				r.roads = Rset;
				r.waters = Wset;
				r.earths = Eset;
				r.landuses = Lset;
					//for(var i in KindSet){console.log(i)};
		
				var hash = this.createHash(r.x, r.y, r.z);
				
				this.loadedblocks[hash] = this.currentRequest
				this.loadqueuehash[hash] =  undefined;
				this.currentRequest = undefined;
				this.cleanLoadedBlocks();
				this.updateLoadQueue();
				
				console.log("tadaaa");
				//this.find("tiledmap").datasource = this;
			
			}
		}
			
			
		
		this.updateLoadQueue = function(){
			
			if (this.currentRequest) return; // already loading something...
			
			if (this.loadqueue.length > 0){
				var zscalar = 1;
				
				// sort queue on distance to cursor
				for (var i = 0;i<this.loadqueue.length;i++){
					var q = this.loadqueue[i];
					var dx = this.centerx - q.x;
					var dy = this.centery - q.y;
					var dz = (this.centerz - q.z)*zscalar;
					q.dist = dx * dx + dy * dy + dz * dz;
				}
				
				this.loadqueue = this.loadqueue.sort(function(a,b){
					if (a.dist > b.dist) return -1;
					if (a.dist < b.dist) return 1; 
					return 0;
				});
				
				var R =	this.currentRequest = this.loadqueue.pop(); 
				this.rpc.urlfetch.grabmap(R.x, R.y, R.z).then(function(result){
					this.loadstring(result.value)
				}.bind(this));
				
				// take closest one from the queue
				// this.requestPending = true;
			}
		}
		
		this.destroy = function(){
			this.clearInterval(this.theinterval);
		}
		
		this.gotoCity = function(name, zoom){
			//console.log(this, name, this.cities);
			if (!name || name.length == 0) return ;
			var n2 = name.toLowerCase().replace(' ', '');
			
			var c = this.cities[n2];
			if (c){
				this.setCenterLatLng(c[0], c[1], zoom);
			}			
			else{
				console.log("city not found:", name);
			}
		}
		
		this.init = function(){
			
			this.cities = {
				   amsterdam: [52.3608307,   4.8626387],
				sanfrancisco: [37.6509102,-122.4889338],
					   seoul: [37.5275421, 126.9748078],
					   seoel: [37.5275421, 126.9748078]
			}
			
			this.theinterval = this.setInterval(function(){
				this.updateLoadQueue();
			}.bind(this), 50);
			
			this.loadinterval = this.setInterval(function(){
				//this.simulateLoaded();
			}.bind(this), 50);
		
			this.setCenterLatLng(this.latlong[0], this.latlong[1], this.zoomlevel);			
		}
	})
	
	this.init = function(){
		this.dataset = this.mapdataset();
	}
	
	define.class(this,"tile", "$ui/view", function(){
		this.attributes = {
			trans: vec2(0)
		}
		this.bg = function(){
			this.position = function(){		
				var r = vec4(mesh.x + view.trans.x, 0, mesh.y + view.trans.y, 1) * view.totalmatrix * view.viewmatrix ;
				return r;
			}
			this.mesh = vec2.array();
			this.mesh.push(0,0);
			this.mesh.push(256,0);

			this.mesh.push(256,0);
			this.mesh.push(256,256);

			this.mesh.push(256,256);
			this.mesh.push(0,256);

			this.mesh.push(0,256);
			this.mesh.push(0,0);
			this.drawtype = this.LINES
			
			this.color = function(){return "blue" }
		}		
	});
	
	
	
	this.bgcolor = vec4(0,0,0,1);
	this.flex = 1;
	this.clearcolor = "black"
	this.overflow = "hidden";
	this.farplane = 20000;
	this.fov = 30;
	this.up = vec3(0,1,0);
	this.lookat = vec3(0,0,0);
	
	
	this.render = function(){
		var res = [this.dataset];
		//res.push(label({bg:0, text:"I am a map" }),this.dataset)
		var res3d = []
		for(var x = -3;x<=3;x++){
			for(var y = -3;y<=3;y++){
				res3d.push(this.tile({trans:vec2(-128 + x*256,-128+ y*256)}));
			}
		}
		
		res.push(view({flex: 1,viewport: "3d",farplane: 20000,camera:vec3(0,-1400 * 0.4,1000 * 0.4), fov: 30, up: vec3(0,1,0)}, res3d));
		return res;
	}
})