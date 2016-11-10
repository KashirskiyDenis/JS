'use strict';

let fs = require('fs');
let genres = require('./data').ID3Genres;
let frameAsoc = require('./data').ID3FrameAsoc;
let imageTypes = require('./data').ID3ImageTypes;

let toString = (buffer, begin, length, ascii) => {
	let str = "";

	for (let i = begin; i < begin + length; i++) {
		if (ascii) {
			let uint = buffer.readUInt8(i);
			if (uint > 191 && uint < 256) {
				str += String.fromCharCode(uint + 848);
			} else if (uint === 168) {
				str += String.fromCharCode(1025);
			} else if (uint === 184) {
				str += String.fromCharCode(1105);
			} else {
				str += String.fromCharCode(uint);
			}
		} else {
			str += String.fromCharCode(buffer.readUInt8(i));
		}
	}

	return str.trim().replace(/\0/g, "");
};

let toString16 = (buffer, begin, length) => {
	let str = "";

	for (let i = begin; i < begin + length; i += 2) {
		str += String.fromCharCode(buffer.readUInt16LE(i));
	}

	return str = str.trim().replace(/\0/g, "");
};

let getID3v1 = (buffer) => {
	let tags = { title : null,
		artist : null,
		album : null,
		number : null,
		year : null,
		genre : null,
		size : 128
	};
	let tag = toString(buffer, 0, 3);

	if (tag !== "TAG") {
		tags.size = 0;
		return tags;
	}
	
	tags.title = toString(buffer, 3, 30, true);
	tags.artist = toString(buffer, 30, 30, true);
	tags.album = toString(buffer, 63, 30, true);
	tags.number = buffer.readUInt8(126);
	tags.year = toString(buffer, 93, 4, true);
	tags.genre = genres[buffer.readUInt8(127)];

	return tags;
};

// let getSize = (buffer) => {
	// let a = (buffer[0] & 0x7f) * 0x200000 +
		// (buffer[1] & 0x7f) * 0x4000 +
		// (buffer[2] & 0x7f) * 0x80 +
		// (buffer[3] & 0x7f);
	// return a;
// };

let getSize = (x) => {
	let x_final = 0x00;
	let a = x & 0xff;
	let b = (x >> 8) & 0xff;
	let c = (x >> 16) & 0xff;
	let d = (x >> 24) & 0xff;

	x_final = x_final | a;
	x_final = x_final | (b << 7);
	x_final = x_final | (c << 14);
	x_final = x_final | (d << 21);

	return x_final;
};

let getID3v2 = (buffer) => {
	let tags = { size : 0 };
	let tag = toString(buffer, 0, 3);

	if (tag !== "ID3") {
		return tags;
	}

	let header = {
		version : buffer.readUInt8(3),
		flag : buffer.readUInt8(5),
		size : getSize(buffer.readUInt32BE(6))
	};
	
	tags.size = header.size + 10;
	buffer = buffer.slice(10, header.size);

	let curSize = 0;
	
	while (curSize < header.size) {
		let frameBit;
		let isFrame = true;
		
		for (let i = 0; i < 3; i++) {
			frameBit = buffer.readUInt8(curSize + i);
			if ((frameBit < 0x41 || frameBit > 0x5A) && (frameBit < 0x30 || frameBit > 0x39)) {
				isFrame = false;
			}
		}
		
		if (!isFrame) {
			break;
		}

		let frame = {
			title : null,
			size : null,
			falgs : { f1 : null, f2 : null }
		};
		let value;

		if (header.version === 2) { // for version 2.2
			frame.title = toString(buffer, curSize, 3);
		} else { // for version 2.3 and 2.4
			frame.title = toString(buffer, curSize, 4);
		}

		// frame.size = getSize(buffer.slice(curSize + 4, curSize + 8));
		frame.size = getSize(buffer.readUInt32BE(curSize + 4));
		frame.falgs.f1 = buffer.readUInt8(curSize + 8);
		frame.falgs.f1 = buffer.readUInt8(curSize + 9);
		
		if (frame.title[0] === "T") { // Text information frames
			let encoding = buffer.readUInt8(curSize + 10);

			if (encoding === 0 || encoding === 3) {
				value = toString(buffer,  curSize + 11, frame.size - 1);
			} else if (encoding === 1) {
				value = toString16(buffer, curSize + 11, frame.size - 1);
			}

			if (frame.title === "TCON") {
				value = value.replace(/\(/, "").replace(/\)/, "");
				if (parseInt(value)) {
					value = genres[parseInt(value)];
				}
			}
		} else if (frame.title[0] === 'W') { //  URL link frames
			value = toString(buffer, curSize + 10, frame.size);
		} else if (frame.title === 'COMM') { // Comments
			let encoding = buffer.readUInt8(curSize + 10);

			if (encoding === 1 || encoding === 2) {
				value = toString16(buffer, curSize + 14, frame.size - 5);
			} else {
				value = toString(buffer, curSize + 14, frame.size - 5);
			}
		} else if (frame.title === 'APIC') {  // Attached picture
			let encoding = buffer.readUInt8(curSize + 10);
			let length = 0;
			let last;
			
			value = {
				type : null,
				mime : null,
				description : null,
				data : null
			};
			
			for (let i = curSize + 11; ; i++) {
				if (buffer.readUInt8(i) === 0x00) {
					length = i - (curSize + 11);
					break;
				}
			}
			
			value.mime = toString(buffer, curSize + 11, length);
			last = curSize + 11 + length + 1;
			value.type = imageTypes[buffer.readUInt8(last)];
			length = 0;
			last++;
			
			for (let i = last; ; i++) {
				if (buffer.readUInt8(i) === 0x00) {
					length = i - last;
					break;
				}
			}

			value.description = toString(buffer, last, length);
			last += length + 1;
			let data = buffer.slice(last, 10 + header.size - 2010);
			// fs.writeFile("C:\\users\\root\\desktop\\df.jpg", data, err => {
				// if (err) {
					// console.log(err);
				// } else {
					// console.log("Save");
				// }
			// });
		}
		
		curSize += frame.size + 10;
		
		tags[frameAsoc[frame.title]] = value;
	}

	return tags;
};

let getMP3FrameHeader = (buffer) => {
	
	let info = {
		// marker : buffer.slice(0, 11),
		audioVersionId : (buffer[1] & 0x18) >> 3,
		layerIndex : (buffer[1] & 0x06) >> 1,
		protectionBit : buffer[1] & 0x01,
		bitrateIndex : (buffer[2] & 0xf0) >> 4,
		samplingRateIndex : (buffer[2] & 0x0c) >> 2,
		paddingBit : buffer[2] & 0x02,
		privateBit : buffer[2] & 0x01,
		channelMode : (buffer[3] & 0xc0) >> 6,
		modeExtension : (buffer[3] & 0x30) >> 4,
		copyrightBit : buffer[3] & 0x08,
		originalBit : buffer[3] & 0x04,
		emphasis : buffer[3] & 0x03
	};
	
	// console.log("Header MP3 frame");
	// console.log(info);
	
	return info;
};

let getDurationCRB = (frameHeader, sizeFile, sizeID3v1, sizeID3v2) => {
	let versionMPEG = ["MPEG-2.5", null, "MPEG-2", "MPEG-1"];
	let versionLayer = [null, "Layer III", "Layer II", "Layer I"];
	let bitrate = {
		"MPEG-1 Layer I" : [null, 32,	64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, null],
		"MPEG-1 Layer II" : [null, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384,  null],
		"MPEG-1 Layer III" : [null, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, null],
		"MPEG-2 Layer I" : [null, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, null],
		"MPEG-2.5 Layer I" : [null, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, null],
		"MPEG-2 Layer II" : [null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, null],
		"MPEG-2.5 Layer II" : [null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, null],
		"MPEG-2 Layer III" : [null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, null],
		"MPEG-2.5 Layer III" : [null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, null]
	};
	let samplingRateIndex = {
		"MPEG-1" : [44100, 48000, 32000, null],
		"MPEG-2" : [22050, 24000, 16000, null],
		"MPEG-2.5" : [11025, 12000, 8000, null]
	};
	let mpeg = versionMPEG[frameHeader.audioVersionId];
	let layer = versionLayer[frameHeader.layerIndex];
	let bit = bitrate[mpeg + " " + layer][frameHeader.bitrateIndex];
	
	if (bit === null) {
		return null;
	}
	
	return parseInt((sizeFile - sizeID3v1 - sizeID3v2) / (bit * 1000) * 8);
};

let getMP3Info = (path) => {
	return new Promise(function(resolve, reject) {
		fs.readFile(path, (err, buffer) => {
			if (err) {
				reject(err);
			}
			let tags = {
				v1 : null,
				v2 : null,
				duration : null
			};
			tags.v1 = getID3v1(buffer.slice(buffer.length - 128));
			tags.v2 = getID3v2(buffer);
			let size = tags.v2.size;
			// console.log("Buffer length: " + buffer.length);
			// console.log("ID3v2 size: " + size);
			let headerFirstGrame = getMP3FrameHeader(buffer.slice(size, size + 4));
			let modeCompression = buffer.slice(size + 36, size + 40).toString(undefined);
			if (modeCompression !== "Xing" && modeCompression !== "VBRI") {
				tags.duration = getDurationCRB(headerFirstGrame, buffer.length, tags.v1.size, tags.v2.size);
			}
			resolve(tags);
		});
	});
};

exports.getMP3Info = getMP3Info;
