const fs = require('node:fs');

class Localization {
	static _load(path="translation.json", encoding="utf8"){
		let obj = {};
		try {
			obj = JSON.parse(fs.readFileSync(path, encoding));
		} catch (e) {
			;
		}
		return obj;
	}

	/**
	 * @param {String} value 
	 * @param  {{}} data 
	 */
	static replace(value, data){
		if (!value || !data)
			return value;
		for (const property in data)
			value = value.replace(`{{${property}}}`, String(data[property]))
		return value;
	}

	static detectLanguage(){
		return process.env.PONG_LANGUAGE || process.env.LANGUAGE || "en_US";
	}

	static _getTLPath(lang){
		return (!!lang) ? "translation.json" : "translation.json";
	}

	constructor(lang){
		this.lang = (!!lang) ? lang : Localization.detectLanguage();
		const sourcePath = "translation.json";
		const path = Localization._getTLPath(lang);

		this.translation = Localization._load(path);
		this.source = Localization._load(sourcePath);
	}

	t(flatkey, data){
		const keys = flatkey.split(".");
		let translation = this.translation;
		let source = this.source;
		let i = 0;
	
		while (translation != undefined 
			&& source != undefined 
			&& i < keys.length
		){
			const key_ = keys[i++];

			if (translation)
				translation = translation[key_];
			if (source)
				source = source[key_];
		}
		return Localization.replace(String(translation || source), data);
	}
}

module.exports = {
	"Localization": Localization
}
