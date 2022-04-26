# HTML Templates
These files are not used aside from being a refrence for the variables `SUCCESS_HTML` and `ERROR_HTML`. At the current stage of the project, the variables must be manually updated. This process should be automated somehow in the future. These variables dictate what HTML is returned to the user on completion of Google's OAuth flow.

## Updating variables with new HTML
1) Make your changes to [success.html](success.html) or [parser.html](parser.html)
2) Open this [HTML compression tool](https://www.textfixer.com/html/compress-html-compression.php).
3) Paste in the uncompressed text and copy the output.
4) Overwrite the variables in [index.js](../index.js)