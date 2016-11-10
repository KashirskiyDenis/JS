'use strict';

let playerCurrent = () => {
	let audio = document.getElementById("audio");
	
	let prevTrackButton = document.getElementById("prev-track");
	let pausePlayButton = document.getElementById("play-track");
	let nextTrackButton = document.getElementById("next-track");
	let loopTrackButton = document.getElementById("loop-track");
	let volumeTrackButton = document.getElementById("volume-track");
	
	let currentTime = document.getElementById("current-time");
	let allTime = document.getElementById("all-time");

	let volumeProgress = document.getElementsByClassName("volume-progress")[0];
	
	let pausePlayTrack = (e) => {
	
		if (audio.paused) {
			if (audio.srcCurrent !== "") {
				audio.play();
				e.toElement.innerHTML = "&#x2759;&#x2759;";
				e.toElement.classList.add("press-button");
			}
		} else {
			audio.pause();
			e.toElement.innerHTML = "&#9658;";
			e.toElement.classList.remove("press-button");
		}
	};

	let loopTrack = (e) => {
		if (audio.loop)	{
			audio.loop = false;
			e.toElement.classList.remove("press-loop");
		} else {
			audio.loop = true;
			e.toElement.classList.add("press-loop");
		}
	};
	
	let changeVolumeTrack = () => {
		if (audio.volume === 1.0) {
			audio.volume = 0.0;
			volumeTrackButton.classList.add("no-volume");
			volumeProgress.style.height = "0%";
		} else {
			audio.volume = 1.0;
			volumeTrackButton.classList.remove("no-volume");
			volumeProgress.style.height = "100%";
		}
	};

	let playList = document.querySelectorAll(".list .list-item");
	
	let trackTitle = document.getElementById("track-title");
	let trackAlbum = document.getElementById("track-album");
	let trackArtist = document.getElementById("track-artist");
	
	let playListNavigation = function(e) {
		let src = "/music/" + this.dataset["srcTrack"];
		
		let currentTrack = document.getElementsByClassName("playing")[0];
		if (currentTrack) {
			currentTrack.classList.remove("playing");
		}
		this.classList.add("playing");
		
		replayTrack(src);
		
		updateTrackInfo(this);
	};
	
	for (let item of playList) {
		item.addEventListener("click", playListNavigation);
	}
	
	let target = playList[0].parentNode;
	
	let observer = new MutationObserver(function(mutations) {
		let removeNode = mutations[0].removedNodes[0];
		if (removeNode.classList.contains("playing")) {
			let nextElement = mutations[0].nextSibling.nextElementSibling;
			if (nextElement) {
				nextElement.dispatchEvent(new Event("click"));
			} else {
				let previousElement = mutations[0].previousSibling.previousElementSibling;
				if (previousElement) {
					previousElement.dispatchEvent(new Event("click"));
				} else {
					progressPlay.style.width = "0%";
					pausePlayButton.innerHTML = "&#9658;";
					pausePlayButton.classList.remove("press-button");
					currentTime.innerHTML = "00:00";
					replayTrack("");
				}
			}
		}
		playList = document.querySelectorAll(".list .list-item");
	});

	let config = { childList: true };

	observer.observe(target, config);
	
	let toTimeFormate = (seconds) => {
		let s = seconds % 60;
		seconds -= s;
		s = Math.round(s);
		if (s < 10) {
			s = "0" + s.toString();
		}
		let m = seconds / 60;
		seconds -= m * 60;
		m = Math.round(m);
		if (m < 10) {
			m = "0" + m.toString();
		}
		return (seconds === 0 ? "" : seconds + ":") + m + ":" + s;		
	};
	
	let updateTrackInfo = (element) => {
		trackTitle.innerHTML = element.dataset["title"];
		trackAlbum.children[1].innerHTML = element.dataset["album"];
		trackArtist.children[1].innerHTML = element.dataset["artist"];
	};
	
	let replayTrack = (src) => {
		audio.pause();
		let sources = audio.getElementsByTagName("source");
		audio.srcCurrent = src;
		for (let source of sources) {
			source.src = src;
		}
		audio.load();
		pausePlayButton.click();
	};
	
	let prevTrack = () => {
		if (playList.length === 0) {
			return;
		}

		for (let key in playList) {
			key = +key;
			if (playList[key].classList.contains("playing")) {
				if (key === 0) {
					break;
				} else {
					let src = "/music/" + playList[key - 1].dataset["srcTrack"];
					playList[key].classList.remove("playing");
					playList[key - 1].classList.add("playing");
					
					replayTrack(src);
					
					updateTrackInfo(playList[key - 1]);
					break;
				}
			}
		}
	};	
	
	let nextTrack = () => {
		if (playList.length === 0) {
			return;
		}
	
		let playListLength = playList.length - 1;
		
		for (let key in playList) {
			if (playList[key].classList.contains("playing")) {
				key = +key;
				if (key === playListLength) {
					break;
				} else {
					let src = "/music/" + playList[key + 1].dataset["srcTrack"];
					playList[key].classList.remove("playing");
					playList[key + 1].classList.add("playing");
					
					replayTrack(src);
					
					updateTrackInfo(playList[key + 1]);
					break;
				}
			}
		}
	};
	
	pausePlayButton.addEventListener("click", pausePlayTrack);

	loopTrackButton.addEventListener("click", loopTrack);
	
	volumeTrackButton.addEventListener("click", changeVolumeTrack);
	
	prevTrackButton.addEventListener("click", prevTrack);
	
	nextTrackButton.addEventListener("click", nextTrack);
	
	let progressPlay = document.getElementsByClassName("progress-play")[0];
	
	audio.addEventListener("timeupdate", () => {
		let cur = Math.round(audio.currentTime);
		let all = audio.duration;
		if (isNaN(all)) {
			all = 1;
		}
		
		progressPlay.style.width = (cur / all * 100) + "%";

		currentTime.innerHTML = toTimeFormate(cur);
	});
	
	// let progressDownload = document.getElementsByClassName("progress-download")[0];
	
	// let setProgressDownload = () => {
		// let all = audio.duration;
		// let buf = audio.buffered.end(0);
		// console.log(buf, all);
		
		// progressDownload.style.width = (Math.floor(buf / all * 100) + "%";
	// };
	
	// audio.addEventListener("progress", setProgressDownload);
	
	let clearForLastTrack = () => {
		let playListLength = playList.length - 1;
		let index = 0;
		for (let item of playList) {
			if (item.classList.contains("playing")) {
				if (index === playListLength) {
					progressPlay.style.width = "0%";
					pausePlayButton.innerHTML = "&#9658;";
					pausePlayButton.classList.remove("press-button");
					currentTime.innerHTML = "00:00";
				} else {
					break;
				}
			}
			index++;
		}		
		
	};
	
	audio.addEventListener("ended", clearForLastTrack);
	
	audio.addEventListener("ended", nextTrack);
	
	audio.addEventListener("loadedmetadata", () => {
		allTime.innerHTML = toTimeFormate(audio.duration);
	});
		
	let timeLine = document.getElementsByClassName("time-line")[0];
	
	let changeTimeTrack = function(e) {
		let maxWidth = this.clientWidth;
		let left = this.getBoundingClientRect().left;
		let newTime = 0;
		document.body.classList.add("no-select");
		
		let seekTimeTrack = function(e) {
			let x = e.pageX;
			if (x >= (left + maxWidth)) {
				newTime = 100;
			} else if (x >= left && x <= (left + maxWidth)) {
				newTime = (x - left) / maxWidth * 100;
			}
			newTime = Math.round(newTime);
			progressPlay.style.width = newTime + "%";
		};
		
		document.addEventListener("mousemove", seekTimeTrack);
		
		let setCurrentTimeTrack = () => {
			document.removeEventListener("mousemove", seekTimeTrack);
			audio.currentTime = Math.round(audio.duration * newTime / 100);
			document.removeEventListener("mouseup", setCurrentTimeTrack);
			document.body.classList.remove("no-select");
		};
		
		document.addEventListener("mouseup", setCurrentTimeTrack);
		
		timeLine.addEventListener("click", function(e) {
			seekTimeTrack(e);
			audio.currentTime = Math.round(audio.duration * newTime / 100);
		});
	};
	
	timeLine.addEventListener("mousedown", changeTimeTrack);
	
	let volumeLine = document.getElementsByClassName("volume-line")[0];
	
	let showVolumBar = () => {
		volumeLine.classList.add("visible");
	};
	
	let hideVolumBar = () => {
		volumeLine.classList.remove("visible");
	};
	
	volumeTrackButton.addEventListener("mouseover", showVolumBar);
	
	volumeTrackButton.addEventListener("mouseout", function(e) {
		if (e.relatedTarget.id !== "volume-bar") {
			hideVolumBar();
		}
	});
	
	let hideVolumBarForLeave = function(e) {
		if (e.relatedTarget.id !== "volume-track") {
			hideVolumBar();
		}
	};
	
	volumeLine.addEventListener("mouseleave", hideVolumBarForLeave);
	
	let volumeBar = document.getElementById("volume-bar");
	
	let changeVolumeTrack2 = function(e) {
		volumeLine.removeEventListener("mouseleave", hideVolumBarForLeave);
		
		let maxVolume = 100;
		let top = this.getBoundingClientRect().top;
		let newVolume = 0;
		document.body.classList.add("no-select");
		
		let seekVolumeTrack = function(e) {
			let y = e.clientY;
			if (y <= top) {
				newVolume = 100;
			} else if (y >= top && y <= (top + maxVolume)) {
				newVolume = top - y + 100;
			}
			newVolume = Math.round(newVolume);
			volumeProgress.style.height = newVolume + "%";
			newVolume = newVolume / 100;
		};
		
		let togleClassNoValue = () =>  {
			if (newVolume == 0) {
				volumeTrackButton.classList.add("no-volume");
			} else {
				volumeTrackButton.classList.remove("no-volume");
			}				
		};
		
		document.addEventListener("mousemove", seekVolumeTrack);
		
		let setCurrentVolumTrack = () => {
			document.removeEventListener("mousemove", seekVolumeTrack);
			audio.volume = newVolume;
			document.removeEventListener("mouseup", setCurrentVolumTrack);
			document.body.classList.remove("no-select");
			togleClassNoValue();
			volumeLine.addEventListener("mouseleave", hideVolumBarForLeave);
			hideVolumBar();
		};
		
		document.addEventListener("mouseup", setCurrentVolumTrack);
		
		volumeBar.addEventListener("click", function(e) {
			seekVolumeTrack(e);
			audio.volume = newVolume;
			togleClassNoValue();
		});
	};
	
	volumeBar.addEventListener("mousedown", changeVolumeTrack2);
};

window.addEventListener("DOMContentLoaded", playerCurrent);