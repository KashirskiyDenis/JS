'use strict';

let getID3Tags = (file, callback) => {
	let getString = (dataView, offset, length) => {
		let str = "";
		
		for (let i = offset; i < offset + length; i++) {
			str += String.fromCharCode(dataView.getUint8(i));
		}
		return str.trim();
	}
	
	let toString16 = (dataView, begin, length) => {
		let str = "";

		for (let i = begin; i < begin + length; i += 2) {
			str += String.fromCharCode(dataView.getUint16(i));
		}

		return str = str.trim().replace(/\0/g, "");
	};
	
	
	let reader = new FileReader();
	
	let getV1 = (dv) => {
		let tags = {};
		
		tags.title = getString(dv, 3, 30);
		tags.artist = getString(dv, 33, 30);
		tags.album = getString(dv, 63, 30);
		tags.number = dv.getUint8(126);
		tags.year = getString(dv, 93, 4);
		tags.genre = genres[dv.getUint8(127)];
		
		return tags;
	};
	
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

	let getID3v2 = (dv) => {
		let tags = { size : 0 };
		let tag = getString(dv, 0, 3);

		if (tag !== "ID3") {
			return tags;
		}

		let header = {
			version : dv.getUint8(3),
			flag : dv.getUint8(5),
			size : getSize(dv.getUint32(6))
		};
		
		tags.size = header.size + 10;
		dv = dv.slice(10, header.size);

		let curSize = 0;
		
		while (curSize < header.size) {
			let frameBit;
			let isFrame = true;
			
			for (let i = 0; i < 3; i++) {
				frameBit = dv.getUint8(curSize + i);
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
				frame.title = getString(dv, curSize, 3);
			} else { // for version 2.3 and 2.4
				frame.title = getString(dv, curSize, 4);
			}

			// frame.size = getSize(dv.slice(curSize + 4, curSize + 8));
			frame.size = getSize(dv.getUint32(curSize + 4));
			frame.falgs.f1 = dv.getUint8(curSize + 8);
			frame.falgs.f1 = dv.getUint8(curSize + 9);
			
			if (frame.title[0] === "T") { // Text information frames
				let encoding = dv.getUint8(curSize + 10);

				if (encoding === 0 || encoding === 3) {
					value = getString(dv,  curSize + 11, frame.size - 1);
				} else if (encoding === 1) {
					value = getString16(dv, curSize + 11, frame.size - 1);
				}

				if (frame.title === "TCON") {
					value = value.replace(/\(/, "").replace(/\)/, "");
					if (parseInt(value)) {
						value = genres[parseInt(value)];
					}
				}
			} else if (frame.title[0] === 'W') { //  URL link frames
				value = getString(dv, curSize + 10, frame.size);
			} else if (frame.title === 'COMM') { // Comments
				let encoding = dv.getUint8(curSize + 10);

				if (encoding === 1 || encoding === 2) {
					value = getString16(dv, curSize + 14, frame.size - 5);
				} else {
					value = getString(dv, curSize + 14, frame.size - 5);
				}
			} else if (frame.title === 'APIC') {  // Attached picture
				let encoding = dv.getUint8(curSize + 10);
				let length = 0;
				let last;
				
				value = {
					type : null,
					mime : null,
					description : null,
					data : null
				};
				
				for (let i = curSize + 11; ; i++) {
					if (dv.getUint8(i) === 0x00) {
						length = i - (curSize + 11);
						break;
					}
				}
				
				value.mime = getString(dv, curSize + 11, length);
				last = curSize + 11 + length + 1;
				value.type = imageTypes[dv.getUint8(last)];
				length = 0;
				last++;
				
				for (let i = last; ; i++) {
					if (dv.getUint8(i) === 0x00) {
						length = i - last;
						break;
					}
				}

				value.description = getString(dv, last, length);
				last += length + 1;
				let data = dv.slice(last, 10 + header.size - 2010);
				value.data = data;
			}
			
			curSize += frame.size + 10;
			
			tags[frameAsoc[frame.title]] = value;
		}

		return tags;
	};
	
	reader.addEventListener("load", function() {
		let dv = new DataView(this.result.slice(this.result.byteLength - 128, this.result.byteLength));
		let tags = {};
		tags.v1 = getV1(dv);
		
		dv = new DataView(this.result);
		tags.v2 = getV2(dv);
		
		callback(tags);
	});
	
	reader.readAsArrayBuffer(file);
};

let genres = [
			'Blues',
			'Classic Rock',
			'Country',
			'Dance',
			'Disco',
			'Funk',
			'Grunge',
			'Hip-Hop',
			'Jazz',
			'Metal',
			'New Age',
			'Oldies',
			'Other',
			'Pop',
			'R&B',
			'Rap',
			'Reggae',
			'Rock',
			'Techno',
			'Industrial',
			'Alternative',
			'Ska',
			'Death Metal',
			'Pranks',
			'Soundtrack',
			'Euro-Techno',
			'Ambient',
			'Trip-Hop',
			'Vocal',
			'Jazz+Funk',
			'Fusion',
			'Trance',
			'Classical',
			'Instrumental',
			'Acid',
			'House',
			'Game',
			'Sound Clip',
			'Gospel',
			'Noise',
			'AlternRock',
			'Bass',
			'Soul',
			'Punk',
			'Space',
			'Meditative',
			'Instrumental Pop',
			'Instrumental Rock',
			'Ethnic',
			'Gothic',
			'Darkwave',
			'Techno-Industrial',
			'Electronic',
			'Pop-Folk',
			'Eurodance',
			'Dream',
			'Southern Rock',
			'Comedy',
			'Cult',
			'Gangsta Rap',
			'Top 40',
			'Christian Rap',
			'Pop / Funk',
			'Jungle',
			'Native American',
			'Cabaret',
			'New Wave',
			'Psychedelic',
			'Rave',
			'Showtunes',
			'Trailer',
			'Lo-Fi',
			'Tribal',
			'Acid Punk',
			'Acid Jazz',
			'Polka',
			'Retro',
			'Musical',
			'Rock & Roll',
			'Hard Rock',
			'Folk',
			'Folk-Rock',
			'National Folk',
			'Swing',
			'Fast  Fusion',
			'Bebob',
			'Latin',
			'Revival',
			'Celtic',
			'Bluegrass',
			'Avantgarde',
			'Gothic Rock',
			'Progressive Rock',
			'Psychedelic Rock',
			'Symphonic Rock',
			'Slow Rock',
			'Big Band',
			'Chorus',
			'Easy Listening',
			'Acoustic',
			'Humour',
			'Speech',
			'Chanson',
			'Opera',
			'Chamber Music',
			'Sonata',
			'Symphony',
			'Booty Bass',
			'Primus',
			'Porn Groove',
			'Satire',
			'Slow Jam',
			'Club',
			'Tango',
			'Samba',
			'Folklore',
			'Ballad',
			'Power Ballad',
			'Rhythmic Soul',
			'Freestyle',
			'Duet',
			'Punk Rock',
			'Drum Solo',
			'A Cappella',
			'Euro-House',
			'Dance Hall',
			'Goa',
			'Drum & Bass',
			'Club-House',
			'Hardcore',
			'Terror',
			'Indie',
			'BritPop',
			'Negerpunk',
			'Polsk Punk',
			'Beat',
			'Christian Gangsta Rap',
			'Heavy Metal',
			'Black Metal',
			'Crossover',
			'Contemporary Christian',
			'Christian Rock',
			'Merengue',
			'Salsa',
			'Thrash Metal',
			'Anime',
			'JPop',
			'Synthpop',
			'Rock/Pop'
		];