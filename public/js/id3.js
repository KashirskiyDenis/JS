'use strict';

let getID3Tags = (file, callback) => {
	let getString = (dataView, offset, length) => {
		let str = "";
		
		for (let i = offset; i < offset + length; i++) {
			str += String.fromCharCode(dataView.getUint8(i));
		}
		return str.trim();
	}
	
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
	
	let getV2 = (dv) => {
		let tags = {};
		
		if (getString(dv, 0, 3) !== "ID3") {
			return tags;
		}
		
		let version = dv.getUint8(3);
		
		if (version < 0 || version > 4) {
			return tags;
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