# HTML Templates
These files are not used aside from being a refrence for the variables `SUCCESS_HTML` and `PARSER_HTML`. Those variables must be manually updated, however this should be automated in the future. They are currently used in the OAuth flow with Google.

## Updating variables with new HTML
1) Make your changes to [success.html](success.html) or [parser.html](parser.html)
2) Open this [HTML compression tool](https://www.textfixer.com/html/compress-html-compression.php).
3) Paste in the uncompressed text and copy the output.
4) Overwrite the variables in [index.jsx](../index.jsx)

