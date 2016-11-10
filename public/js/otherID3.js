DataView.prototype.getChar = function(start) {
    return String.fromCharCode(this.getUint8(start));
};

DataView.prototype.getString = function(start,length) {
    for(var i = 0,v = ''; i < length; ++i) {
        v += this.getChar(start + i);
	}
    return v;
};

DataView.prototype.getInt = function(start) {
    return (this.getUint8(start) << 21) | (this.getUint8(start + 1) << 14) | (this.getUint8(start + 2) << 7) | this.getUint8(start + 3);
};

function readID3(a) {
    // var a = new DataView(this.result);
    // Parse it quickly
    if ( a.getString(0, 3) != "ID3" ) {
        return false;
	}
	
    // True if the tag is pre-V3 tag (shorter headers)
    var TagVersion = a.getUint8(3);
	
    // Check the version
    if ( TagVersion < 0 || TagVersion > 4 ) {
        return false;
	}
	
    // Get the ID3 tag size and flags; see 3.1
    var tagsize = a.getInt(6) + 10;
	console.log(tagsize);
	//(a.getUint8(9) & 0xFF) | ((a.getUint8(8) & 0xFF) << 7 ) | ((a.getUint8(7) & 0xFF) << 14 ) | ((a.getUint8(6) & 0xFF) << 21 ) + 10;
    var uses_synch = (a.getUint8(5) & 0x80) != 0 ? true : false;
    var has_extended_hdr = (a.getUint8(5) & 0x40) != 0 ? true : false;
	
    var headersize = 0;         
    // Read the extended header length and skip it
    if ( has_extended_hdr ) {
        var headersize = a.getInt(10);
		//(a.getUint8(10) << 21) | (a.getUint8(11) << 14) | (a.getUint8(12) << 7) | a.getUint8(13); 
	}
	
    // Read the whole tag
    var buffer = new DataView(a.buffer.slice(10 + headersize,tagsize));
	
    // Prepare to parse the tag
    var length = buffer.byteLength;
	
    // Recreate the tag if desynchronization is used inside; we need to replace 0xFF 0x00 with 0xFF
    if ( uses_synch ) {
        var newpos = 0;
        var newbuffer = new DataView(new ArrayBuffer(tagsize));
		
        for ( var i = 0; i < tagsize; i++ ) {
            if ( i < tagsize - 1 && (buffer.getUint8(i) & 0xFF) == 0xFF && buffer.getUint8(i + 1) == 0 ) {
                newbuffer.setUint8(newpos++, 0xFF);
                i++;
                continue;
			}
			
            newbuffer.setUint8(newpos++, buffer.getUint8(i));                 
		}
		
        length = newpos;
        buffer = newbuffer;
	}
	
    // Set some params
    var pos = 0;
    var ID3FrameSize = TagVersion < 3 ? 6 : 10;
    var m_title;
    var m_artist;
	
    // Parse the tags
    while ( true ) {
        var rembytes = length - pos;
		
        // Do we have the frame header?
        if ( rembytes < ID3FrameSize )
			break;
		
        // Is there a frame?
        if ( buffer.getChar(pos) < 'A' || buffer.getChar(pos) > 'Z' )
			break;
		
        // Frame name is 3 chars in pre-ID3v3 and 4 chars after
        var framename;
        var framesize;
		
        if ( TagVersion < 3 ) {
            framename = buffer.getString(pos, 3);
            framesize = ((buffer.getUint8(pos + 5) & 0xFF) << 8 ) | ((buffer.getUint8(pos + 4) & 0xFF) << 16 ) | ((buffer.getUint8(pos + 3) & 0xFF) << 24 );
		} else {
            framename = buffer.getString(pos, 4);
            framesize = buffer.getInt(pos + 4);
			//(buffer.getUint8(pos+7) & 0xFF) | ((buffer.getUint8(pos+6) & 0xFF) << 8 ) | ((buffer.getUint8(pos+5) & 0xFF) << 16 ) | ((buffer.getUint8(pos+4) & 0xFF) << 24 );
		}
		
        if ( pos + framesize > length )
			break;
		
		console.log(framename, framesize);
        if ( framename== "TPE1"  || framename== "TPE2"  || framename== "TPE3"  || framename== "TPE" ) {
            if ( m_artist == null )
			m_artist = parseTextField( buffer, pos + ID3FrameSize, framesize );
		}
		
        if ( framename== "TIT2" || framename== "TIT" ) {
            if ( m_title == null )
			m_title = parseTextField( buffer, pos + ID3FrameSize, framesize );
		}
		
        pos += framesize + ID3FrameSize;
        continue;
	}
    console.log(m_title, m_artist);
    return m_title != null || m_artist != null;
}

function parseTextField( buffer, pos, size ) {
    if ( size < 2 )
	return null;
	
    var charcode = buffer.getUint8(pos); 
	
    //TODO string decoding         
    // if ( charcode == 0 )
        // charset = Charset.forName( "ISO-8859-1" );
	// else if ( charcode == 3 )
        // charset = Charset.forName( "UTF-8" );
	// else
        // charset = Charset.forName( "UTF-16" );
		
	// return charset.decode( ByteBuffer.wrap( buffer, pos + 1, size - 1) ).toString();
    return buffer.getString(pos + 1, size - 1);
}

window.addEventListener("DOMContentLoaded", function() {

document.querySelector('input[type="file"]').onchange = function (e) {
    var reader = new FileReader();

    reader.onload = function (e) {
        // var dv = new DataView(this.result);
		readID3(new DataView(this.result));
    };

    reader.readAsArrayBuffer(this.files[0]);
};	
});
