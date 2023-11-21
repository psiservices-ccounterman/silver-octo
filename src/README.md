

`````
openssl genrsa -out admin-privkey.pem 2048
openssl rsa -in admin-privkey.pem -pubout -out admin-pubkey.pem
openssl genrsa -out secure-browser-privkey.pem 2048
openssl rsa -in secure-browser-privkey.pem -pubout -out secure-browser-pubkey.pem
`````
