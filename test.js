const fs = require("fs");
const https = require("https");

function uploadFile() {
    var CHUNK_SIZE = 10 * 256 * 1024, // 10MB
    buffer = Buffer.alloc(CHUNK_SIZE),
    filePath = '/Users/mackenzieboudreau/Downloads/Screen Shot 2022-04-21 at 4.59.31 PM.png';
    var n_chunk = 0;

    const file = {size: 589511};

    fs.open(filePath, 'r', function(err, fd) {
    if (err) throw err;
    const readNextChunk = () => {
        fs.read(fd, buffer, 0, CHUNK_SIZE, null, (err, nread) => {
            n_chunk++;
            if (err) throw err;

            if (nread === 0) {
                fs.close(fd, function(err) {
                if (err) throw err;
                });
                return;
            }

            var data;
            if (nread < CHUNK_SIZE)
                data = buffer.slice(0, nread);
            else
                data = buffer;
            const options = {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ya29.A0ARrdaM-r39SFvN0IpieTilgqwCQ5d3f47xA4qslb8QTt6DOd7uAdPbYy6KwW8YMCl9o6RTQeF0ziag4IMgai4b34n2H4x3bFnIkvI8u_apwRNXfyOJ1CZQ0jHg57PXUpSw2YLjUIu9RKYBuzqfWJkr4mYN2r`,
                    'Content-Length': Math.min(CHUNK_SIZE, file.size),
                    'Content-Range': `bytes 0-${Math.min(CHUNK_SIZE * n_chunk, file.size)}/${file.size}`
                },
                body: data.toJSON().data
            }

            https.get('https://blockchain.info/q/24hrprice', options, (result) => {
                console.log('RATE: ', result);
            });
         
        });
    }
    readNextChunk();
    });
}

console.log(uploadFile())