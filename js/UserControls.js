function UserControls(domElement){
	this.domElement = domElement;
	this.controlElements = [];
	this.rebuildFromMap = {};
	this.init();
}

UserControls.prototype.init = function() {
	var controlsAndDefaults = [
		{inputType: 'number', name: 'x', value: 33},
		{inputType: 'number', name: 'y', value: 3},
		//{inputType: 'slider', name: 'quality', value: 0.5},
		{inputType: 'checkbox', name: 'rivers', value: true},
		{inputType: 'slider', name: 'terrain', value: 0.25},
		{inputType: 'slider', name: 'scale', value: 0.5},
		{inputType: 'slider', name: 'sea level', value: 0.55},
		{inputType: 'slider', name: 'flat', value: 0.2},
		{inputType: 'slider', name: 'shore', value: 0.2},
		{inputType: 'slider', name: 'cityness', value: 0.11, rebuildFrom: 'roads'},
	];

	for (var i = 0; i < controlsAndDefaults.length; i++) {
		// Init control html
		var inputType = controlsAndDefaults[i].inputType;
		var name = controlsAndDefaults[i].name;
		var value = controlsAndDefaults[i].value;
		var controlElement = this[inputType](name, value);
		this.controlElements.push(controlElement);

		// init rebuildFromMap
		this.rebuildFromMap[controlElement.attr('id')] = controlsAndDefaults[i].rebuildFrom;
	};
};

UserControls.prototype.createDefualtInput = function(name, value) {
	$(this.domElement).append($('<span>&nbsp;' + name + ':</span>'));
	var $inputElement = $('<input>');
	$inputElement.attr('tabIndex','-1');
	var propertyName = name.replace(/ /g, '_');
	$inputElement.attr('id', propertyName);

	var self = this;
	$inputElement.change(function(event){
		var rebuildFrom = self.rebuildFromMap[event.target.id];
		rebuildScene(rebuildFrom);
	});

	$(this.domElement).append($inputElement);
	return $inputElement;
};

UserControls.prototype.slider = function(name, value) {
	$inputElement = this.createDefualtInput(name, value);
	$inputElement.attr('value', 100*value);
	$inputElement.attr('type', 'range');
	return $inputElement;
};

UserControls.prototype.number = function(name, value) {
	$inputElement = this.createDefualtInput(name, value);
	$inputElement.attr('value', value);
	$inputElement.attr('type', 'number');
	return $inputElement;
};

UserControls.prototype.checkbox = function(name, value) {
	$inputElement = this.createDefualtInput(name, value);
	$inputElement.attr('checked', value);
	$inputElement.attr('type', 'checkbox');
	return $inputElement;
};

UserControls.prototype.getControls = function() {
	var controls = {};
	for (var i = 0; i < this.controlElements.length; i++) {
		var control = this.controlElements[i];
		if(control.attr('type') === 'range'){
			controls[control.attr('id')] = 0.01*Number(control[0].value);
		}
		if(control.attr('type') === 'number'){
			controls[control.attr('id')] = Number(control[0].value);
		}
		if(control.attr('type') === 'checkbox'){
			controls[control.attr('id')] = control[0].checked;
		}
	};

	// Add default quality 0.5
	controls.quality = 0.5;
	return controls;
};