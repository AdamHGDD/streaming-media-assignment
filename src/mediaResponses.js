// File accessing include
const fs = require('fs');
const path = require('path');

// Helper method for setting up the stream object and returning it
const setUpStream = (file, start, end, response) => {
	// Create steam object
	const stream = fs.createReadStream(file, { start, end });

	// Define response to opening file
	stream.on('open', () => {
		stream.pipe(response);
	});

	// Define response to an error
	stream.on('error', (streamErr) => {
		response.end(streamErr);
	});

	return stream;
};

// Helper method for parsing the request headers
const parseHeader = (request) => {
	// Get headers from the parameters
	let { range } = request.headers;

	// Check if headers are empty
	if (!range) {
		// Sets default if no header is found
		range = 'bytes=0-';
	}

	// Remove junk from string
	return range.replace(/bytes=/, '').split('-');
}

// Method for media requests
const loadFile = (request, response, filePath, format) => {
	// Create a file object based on the found file
	const file = path.resolve(__dirname, filePath);

	// Analyze the new file object
	fs.stat(file, (err, stats) => {
		// Check for errors
		if (err) {
			if (err.code === 'ENOENT') {
				response.writeHead(404);
			}
			return response.end(err);
		}

		// Use helper method
		const positions = parseHeader(request);

		// Get first number out
		let start = parseInt(positions[0], 10);

		// Possible end
		const total = stats.size;
		// Check for if a second value exists
		const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

		// Make sure start isn't larger than end
		if (start > end) {
			start = end - 1;
		}

		// How much content is there
		const chunksize = (end - start) + 1;

		// Tell the browser that we are currently working on outputting a video
		response.writeHead(206, {
			'Content-Range': `bytes ${start}-${end}/${total}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunksize,
			'Content-Type': format,
		});

		return setUpStream(file, start, end, response);
	});
};

// Method for passing in the party video
const getParty = (request, response) => {
	loadFile(request, response, '../client/party.mp4', 'video/mp4')
};

// Method for passing in the bird video
const getBird = (request, response) => {
	loadFile(request, response, '../client/bird.mp4', 'video/mp4')
};

// Method for passing in the bling audio
const getBling = (request, response) => {
	loadFile(request, response, '../client/bling.mp3', 'audio/mpeg')
};

// Export methods
module.exports.loadFile = loadFile;
module.exports.getParty = getParty;
module.exports.getBird = getBird;
module.exports.getBling = getBling;
