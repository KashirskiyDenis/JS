'use strict';

let exitReady = () => {
	let exit = document.getElementById("exit");
	
	let exitFromSite = () => {
		let request = new XMLHttpRequest();
		request.open("POST", "/player/logout", true);
		request.send();
	};
	
	exit.addEventListener("click", exitFromSite);
};

window.addEventListener("DOMContentLoaded", exitReady);