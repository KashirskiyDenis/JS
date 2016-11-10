"use strict";

window.onload = () => {

	let time = new Date;

	let setTime = (id, t, pos) => {
		let s = time.getSeconds();
		if (t === "m") {
			s = time.getMinutes();
		} else if (t === "h") {
			s = time.getHours();
		}
		s = (s < 10 ? "0" + s : s).toString();
		let divs = document.getElementById(id).children[0].getElementsByTagName("div");
		for (let div of divs) {
			if (div.className !== "number__flip") {
				div.innerHTML = s[pos];
			}
		}
	};

	setTime("sec_first", "s", 0);
	setTime("sec_second", "s", 1);
	setTime("min_first", "m", 0);
	setTime("min_second", "m", 1);
	setTime("hour_first", "h", 0);
	setTime("hour_second", "h", 1);

	let foo = (element, count = 0) => {
		let num = element.getElementsByClassName("number")[0];
		let numBack = num.children[0];
		let numDown = num.children[1];
		let flipFront = num.children[2].children[0];
		let flipBack = num.children[2].children[1];

		numBack.innerHTML = count;
		flipBack.innerHTML = count;

		num.children[2].classList.add("number__flip-animate");
		setTimeout(() => {
			num.children[2].classList.remove("number__flip-animate");
			numDown.innerHTML = count;
			flipFront.innerHTML = count;
		}, 950);
	};

	let divSeconds = document.getElementById("sec_second");
	let divMinutes = document.getElementById("min_second");
	let divHours = document.getElementById("hour_second");

	let iteration = (div, time) => {
		if (time < 10) {
			time = "0" + time;
		}
		time = time.toString();

		foo(div, time[1]);

		if (time[1] === "0") {
			foo(div.previousElementSibling, time[0]);
		}
	};

	setInterval(() =>  {
		time = new Date;
		let [hours, minutes, seconds] = [time.getHours(), time.getMinutes(), time.getSeconds()];
		iteration(divSeconds, seconds);
		if (seconds === 0) {
			iteration(divMinutes, minutes);
			if (minutes === 0) {
				iteration(divHours, hours);
			}
		}
	}, 1000);
};
