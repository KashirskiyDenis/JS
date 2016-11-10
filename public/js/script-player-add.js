'use strict';

let addReady = function() {
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
			/*
				request.upload.addEventListener("progress", function(e) {
				if (e.lengthComputable) {
					let per = e.loaded / e.total;
					per = parseInt(per * 100);
					
					console.log(per);
				}
			});
			*/
			request.onerror = function() {
				reject(new Error("Network error"));
			};
			
			request.send(formElement);
		});
		
		return promise;
	};

	let sendFiles = function(files) {
		let form = new FormData();
		
		if (!(files instanceof FileList)) {
			files = this.files;
		}
		
		for (let file of files) {
			if (file.type === "audio/mp3") {
				form.append("files", file, file.name);
			}
		}
		
		if (form.getAll("files").length > 0 ) {
			ajax("POST", "/player/add", form).then(response => {
				response = JSON.parse(response).notAdd;
				if (response.length === 0) {
					// console.info("Ваши файлы сохранены.");
					alert("Ваши файлы сохранены.");
					addFileNameInDropzone(files);
				}
			})
			.catch(error => {
				// console.error(error);
				alert(error);
			});
		}
	};

	let addFileNameInDropzone = (files) => {
		if (dropzone.children.length > 0) {
			if (dropzone.children[0].tagName === "P") {
				dropzone.innerHTML = "";
			}
		}
		
		for (let file of files) {
			if (!/^audio/.test(file.type)) {
				continue;
			}
			
			let div = document.createElement("div");
			div.classList.add("list-item");
			div.innerHTML = `<p class="text">${file.name}</p>`;
			dropzone.appendChild(div);
		}
		
		if (dropzone.children.length === 0) {
			dropzone.innerHTML = '<p class="text">Переместите файлы сюда и загрузка начнется автоматически.</p>';
		}
	};
	
	let dropFiles = function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		let files = e.dataTransfer.files;	
		sendFiles(files);
	};

	let dropzone = document.getElementById("dropzone");
	
	let dragover = function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	};

	let form = document.getElementById('form-send-files');
	
	let uploadFileByButton = () => {
		// let files = form.querySelector('input[type="file"]').files;
		// [].forEach.call(files, file => {
			// id3(file, function(err, tags) {
				// if (err) {
					// console.log(err);
				// } else {
					// console.log(tags);
				// }
			// });
		// });
		
		ajax("POST", "/player/add", new FormData(form)).then(response => {
			// console.log(response);
			response = JSON.parse(response).notAdd;
			if (response.length === 0) {
				addFileNameInDropzone(files);
				// console.info("Ваши файлы сохранены.");
				alert("Ваши файлы сохранены.");
			}
		})
		.catch(error => {
			console.error(error);
			// alert(error);
		});
	};
	
	dropzone.addEventListener("dragover", dragover);

	dropzone.addEventListener("drop", dropFiles);
	
	let button = document.getElementById("submit");
	
	button.addEventListener("click", uploadFileByButton);
};

window.addEventListener("DOMContentLoaded", addReady);
