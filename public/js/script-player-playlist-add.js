'use strict';

let playlistAddReady = function() {
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

	let playlists = document.getElementById("playlists");

	let addPlaylist = (playlist) => {
		if (playlist.hasOwnProperty("_id")) {	
			if (playlists.children.length > 0) {
				if (playlists.children[0].tagName === "P") {
					playlists.innerHTML = "";
				}
			}

			let div = document.createElement("div");
			div.classList.add("list-item");
			div.id = playlist._id;
			div.innerHTML = `<p class="text">${playlist.title}</p>
							<p class="text light">Композиций: 0</p>`;
			div.addEventListener("click", openPlaylist);
			playlists.appendChild(div);
		}
	};

	let form = document.getElementById("form-playlist-work");
	let idPlaylist = document.getElementById("idPlaylist");
	let titlePlaylist = document.getElementById("title");

	let upsertPlaylist = () => {
		let formData = new FormData(form);

		ajax("POST", "/player/playlists/personal/add", formData).then(response => {
			response = JSON.parse(response);
			let pl = playlists.querySelector(`[id='${response._id}']`);
			if (pl) {
				pl.innerHTML = pl.title;
			} else {
				addPlaylist(response);
			}
			form.reset();
		})
		.catch(error => console.error(error));
	};

	let upsert = document.getElementById("upsert");
	let del = document.getElementById("delete");

	upsert.addEventListener("click", upsertPlaylist);

	let songsInPl = document.getElementById("songs-in-playlist");
	
	let openPlaylist = function(e) {
		let pl = e.currentTarget;
		titlePlaylist.value = pl.children[0].innerHTML;
		let idPl = pl.dataset.idPlaylist;
		idPlaylist.value = idPl;

		if (songsInPl.dataset.idPlaylist !== idPl) {
			ajax("GET", "/player/json/playlist?id=" + idPl).then(response => {
				let pl = JSON.parse(response)[0];
				songsInPl.innerHTML = "";
				songsInPl.dataset.idPlaylist = idPl;
				
				for (let song of pl.songs) {
					ajax("GET", "/player/json/song?id=" + song).then(song => {
						song = JSON.parse(song)[0];
						songsInPl.innerHTML += `<div class="list-item" data-context-menu="true" data-id-song="${song._id}">
							<p class="text bold">${song.title}</p>
							<p class="text light">${song.artist}</p>
						</div>`;
					})
					.catch(error => console.log(error));
				}
				
				if (pl.songs.length === 0) {
					songsInPl.innerHTML = '<p class="text">Вы не выбрали плейлист или он пуст.</p>';
				}
			})
			.catch(error => console.log(error));
		}
	};

	for (let pl of playlists.children) {
		if (pl.tagName !== "P") {
			pl.addEventListener("click", openPlaylist);
		}
	}

	let deletePlaylist = () => {
		let formData = new FormData(form);
		let id = formData.get("idPlaylist");

		if (id) {
			ajax("DELETE", "/player/playlists/personal/add", formData).then(response => {
				response = JSON.parse(response);
				let pl = playlists.querySelector(`[id='${id}']`);
				pl.parentNode.removeChild(pl);
				form.reset();
				if (playlists.children.length === 0) {
					playlists.innerHTML = '<p class="text">Список Ваших плейлистов пуст.</p>';
				}
				songsInPl.innerHTML = '<p class="text">Вы не выбрали плейлист или он пуст.</p>';
			})
			.catch(error => {
				console.error(error);
			});
		}
	};

	del.addEventListener("click", deletePlaylist);
};

window.addEventListener("DOMContentLoaded", playlistAddReady);
