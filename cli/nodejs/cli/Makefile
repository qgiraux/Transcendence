all:
	echo 'console.log("Hello, ${process.argv[2]}!");' > hello.js
	echo '{ "main": "hello.js", "output": "sea-prep.blob" }' > sea-config.json 
	node --experimental-sea-config sea-config.json 
	cp $$(command -v node) hello 
	npx postject hello NODE_SEA_BLOB sea-prep.blob \
		--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2


