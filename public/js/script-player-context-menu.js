'use strict';

let contextMenuReady = function() {
	let ajax = (type, url, formElement) => {
		let promise = new Promise(function(resolve, reject) {
			let request = new XMLHttpRequest();
			request.open(type, url, true);

			request.onload = function() {
				if (this.status === 200) {
					resolve(this.response);
				} else {
					let error = new Error(this.statusText);
					error.code = this.status;
					reject(error);
				}
			};

			request.onerror = function() {
				reject(new Error("Network error"));
			};

			request.send(formElement);
		});
		return promise;
	};

	let contextMenu = document.getElementById("context-menu");
	let idSong = document.getElementById("modal-idSong");
	let userPl = document.getElementById("modal-playlists");
	let currentTarget;

	let toggleMenuVisible = (bool) => {
		if (bool) {
			contextMenu.classList.add("visible");
		} else {
			contextMenu.classList.remove("visible");
		}
	}

	let checkCallContextMenu = (el) => {
		if (el.dataset && el.dataset.contextMenu) {
			return el;
		} else {
			while (el = el.parentNode) {
				if (el.dataset && el.dataset.contextMenu) {
					return el;
				}
			}
		}

		return false;
	};

	let setContextMenuPosition = (e) => {
		contextMenu.style.top = e.pageY + "px";
		contextMenu.style.left = e.pageX + "px";
	};

	let callContextMenu = function(e) {
		let el = e.target;

		let element = checkCallContextMenu(el);
		if (element) {
			e.preventDefault();
			toggleMenuVisible(true);
			setContextMenuPosition(e);
			idSong.value = element.dataset.idSong;
			currentTarget = element;
		} else {
			toggleMenuVisible(false);
		}
	};

	document.addEventListener("contextmenu", callContextMenu);

	let clickDocument = function(e) {
		let button = e.button || e.which;

		if (button === 1) {
			toggleMenuVisible(false);
		}
	};

	document.addEventListener("click", clickDocument);

	let modalBg = document.getElementById("modal-background");
	let song;

	let openModalAddToPlaylist = () => {
		let formData = new FormData();

		modalBg.style.display = "flex";

		ajax("GET", `/player/json/song?id=${idSong.value}`).then(response => {
			return song = JSON.parse(response)[0];
		})
		.then(song => {
			return ajax("GET", "/player/json/playlist", formData);
		})
		.then(response => {
			let playlists = JSON.parse(response);
			if (playlists.length !== 0) {
				let select = document.createElement("SELECT");
				select.classList.add("select-input");
				select.name = "pls";
				select.size = playlists.length > 4 ? 5 : playlists.length;
				select.multiple = true;
				select.autofocus = true;
				for (let pl of playlists) {
					if (pl.songs.indexOf(song._id) === -1) {
						select.innerHTML += `<option class="text" value="${pl._id}">${pl.title}</option>`;
					} else {
						select.innerHTML += `<option class="text" value="${pl._id}" selected>${pl.title}</option>`;
					}
				}
				userPl.innerHTML = select.outerHTML;
			}

			document.body.classList.add("disable-scroll");
		})
		.catch(error => {
			console.error(error);
		});
	};

	document.getElementById("openAddToPls").addEventListener("click", openModalAddToPlaylist);

	let closeModal = () => {
		modalBg.style.display = "none";
		userPl.innerHTML = `<span class="text">У Вас нет плейлистов</span>`;
		document.body.classList.remove("disable-scroll");
	};

	modalBg.addEventListener("click", function(e) {
		if (this === e.target) {
			closeModal();
		}
	});

	let form = document.getElementById("form-add-toPlaylist");

	let addSongToPl = () => {
		if (song) {
			let formData = new FormData(form);

			ajax("POST", "/player/add/toPlaylist", formData).then(response => {
				response = JSON.parse(response);
				console.log(response);
				closeModal();
			})
			.catch(error => {
				console.error(error);
			});
		}
	};

	document.getElementById("add").addEventListener("click", addSongToPl);

	let deleteFromPlaylist = function(e) {
		let idPl = currentTarget.parentNode.dataset.idPlaylist;
		if (idPl) {
			let formData = new FormData();
			formData.append("action", "delete");
			formData.append("idSong", idSong.value);
			formData.append("pls", idPl);
			ajax("POST", "/player/add/toPlaylist", formData).then(response => {
				let pl = JSON.parse(response)[0];
				// console.log(pl);
			})
			.then(response => {
				currentTarget.parentNode.removeChild(currentTarget);
			})
			.catch(error => console.log(error));
		}
	};

	document.getElementById("removeFromPlaylist").addEventListener("click", deleteFromPlaylist);
};

window.addEventListener("DOMContentLoaded", contextMenuReady);
