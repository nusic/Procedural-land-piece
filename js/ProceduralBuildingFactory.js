function ProceduralBuildingFactory (label) {
	this.label = label;
	this.numBuildings = 0;

	// Create a cube geometry
	this.houseBaseGeometry = new THREE.CubeGeometry(1, 1, 1, 1, 1, 2);

	// side 1   side 2   top     
	// +-+-+    +---+   +---+
	// |   |    |   |   +   +
	// +-+-+    +---+   +---+  

	// And displace two vertices so that we get a simple house base geometry
	this.houseBaseGeometry.vertices[1].y += 0.25;
	this.houseBaseGeometry.vertices[7].y += 0.25;

	// side 1   side 2   top
	//   +      +---+ 
	//  / \     |   |
	// +   +    +---+   +---+
	// |   |    |   |   + - +
	// +-+-+    +---+   +---+  
	
	

	this.buildingMaterials = [
		new THREE.MeshPhongMaterial( { color: 0xffffff, shininess: 0, wireframe: false} ),
		new THREE.MeshPhongMaterial( { color: 0x855E42, shininess: 0} ),
	]
}

ProceduralBuildingFactory.prototype.getBuildingMaterial = function() {
	return this.buildingMaterials[this.numBuildings % this.buildingMaterials.length];
};



ProceduralBuildingFactory.prototype.createBuilding = function(scale) {
	var buildingGroup = new THREE.Object3D();
	var material = this.getBuildingMaterial();
	var buildingMesh = new THREE.Mesh(this.houseBaseGeometry, material);
	buildingMesh.scale.multiplyScalar(scale);

	// Scale one of the axes to get variation
	var axisToScale = "xyz".charAt((this.numBuildings >> 2) % 3);
	buildingMesh.scale[axisToScale] *= 1.5;
	buildingGroup.add(buildingMesh);

	this.numBuildings++;
	return buildingGroup;
};

ProceduralBuildingFactory.prototype.create = function(controls) {
	this.numBuildings = 0;
	var buildingMeshGroup = new THREE.Object3D();

	if(controls.dirtyBuild || !controls.roadsData) {
		return buildingMeshGroup;
	}

	var groundMesh = controls.groundData.groundMesh;
	var roads = controls.roadsData.roads;
	var buildingScale = 0.2 * controls.roadsData.integrity;

	var worldFlatHeight = controls.shoresData.flatHeight * groundMesh.size.heightLimit;
	var worldFlatEpsilon = controls.shoresData.flatEpsilon * groundMesh.size.heightLimit;

	function norm2(a,b){
		var dx = a.x - b.x;
		var dy = a.y - b.y;
		return dx*dx + dy*dy
	}

	var houseTree = new kdTree([], norm2, ['x', 'y']);
	for (var i = 0; i < roads.length; i++) {
		var roadSegment = roads[i];
		var v1 = roadSegment[0];
		var v2 = roadSegment[1];

		// mid position of the road segment
		var xMid = 0.5*(v1.x + v2.x);
		var yMid = 0.5*(v1.y + v2.y);

		// we want buildings rotated such that they are
		// aligned with road they are next to
		var rotation = Math.atan2(v2.x-v1.x, v2.y-v1.y);

		// We don't want buildings blocking the roads, so place it right next to it
		var x = xMid + 1.5*buildingScale*Math.cos(-rotation);
		var y = yMid + 1.5*buildingScale*Math.sin(-rotation);

		try{
			// If the position not is on flat ground, discard this building
			var height = groundMesh.geometry.vertexAtPosition(x, y).z;
			if(Math.abs(height - worldFlatHeight) > worldFlatEpsilon){
				continue;
			}
		}
		catch(e){ 
			// Out of bounds exception, thrown by PlaneGeometry.vertexAtPosition(x, y)
			// This can happen if the position (x, y) we generated for the building 
			// is laying outside the plane. In this case just discard this building

			//console.error(e);
			continue; 
		}

		var buildingMesh = this.createBuilding(buildingScale);
		buildingMesh.rotation.y = -rotation - Math.PI * 0.5;
		buildingMesh.position.x = x;
		buildingMesh.position.y = groundMesh.flatHeight;
		buildingMesh.position.z = -y;
		

		buildingMeshGroup.children.push(buildingMesh);


		/*
		var buildingMesh = this.createBuilding(buildingScale);
		buildingMesh.position.x = xMid - 2*buildingScale*Math.cos(-rotation);
		buildingMesh.position.y = groundMesh.geometry.vertexAtPosition(xMid, yMid).z;
		buildingMesh.position.z = -(yMid - 2*buildingScale*Math.sin(-rotation));
		buildingMesh.rotation.y = -rotation - Math.PI * 0.5;
		buildingMeshGroup.children.push(buildingMesh);
		*/
	};

	return buildingMeshGroup;
};