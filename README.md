FreeCodeCamp API Basejump: URL Shortener Microservice

User stories:

I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.

When I visit that shortened URL, it will redirect me to my original link.

Example creation usage:
https://urlshortener-tgallin.herokuapp.com/https://www.google.com
will output
{ "original_url":"https://www.google.com", "short_url":"https://urlshortener-tgallin.herokuapp.com/1234" }

Usage:
https://urlshortener-tgallin.herokuapp.com/1234
Will redirect to:
https://www.google.com