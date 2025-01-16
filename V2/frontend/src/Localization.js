const pathEn = '../../local/en-us/translation.json';
const pathFr = '../../local/fr-fr/translation.json';
const pathEs = '../../local/es-es/translation.json';

class Localization {
  static async _load(path = pathEn) {
    let obj = {};
    try {
      const response = await fetch(path);
      obj = await response.json();
    } catch (e) {
      console.log("Error in the translation file", e);
    }
    return obj;
  }

  static replace(value, data) {
    if (!value || !data) return value;
    for (const property in data) {
      value = value.replace(`{{${property}}}`, String(data[property]));
    }
    return value;
  }

  static detectLanguage() {
    return navigator.language || "en-us";
  }

  static _getTLPath(lang) {
    if (lang === 'fr-fr') {
      return pathFr;
    } else if (lang === 'es-es') {
      return pathEs;
    } else {
      return pathEn;
    }
  }

  constructor(lang) {
    this.lang = Localization.detectLanguage();
	console.log("The language is = ");
	console.log(this.lang);
    this.translation = null;
    this.source = null;
  this.setLanguage("fr-fr");
	this.loadTranslations();
  }

  async loadTranslations() {
    const path = Localization._getTLPath(this.lang);
    this.translation = await Localization._load(path);
	if (!this.translation)
		console.log("ERROR FETCHING TRANSLATION");
	this.source = await Localization._load(pathEn);
    this.isLoaded = true;
	if (!this.isLoaded)
		console.log("ERROR LOADING TRANSLATION");
  }

  async setLanguage(lang) {
    if (lang !== this.lang) {
      this.lang = lang;
      await this.loadTranslations();
  }}

  async t(flatkey, data) {
    if (!this.isLoaded) {
      await this.loadTranslations();
    }

    const keys = flatkey.split(".");
    let translation = this.translation;
    let source = this.source;
    let i = 0;

    while (translation !== undefined && source !== undefined && i < keys.length) {
      const key_ = keys[i++];
      if (translation) translation = translation[key_];
      if (source) source = source[key_];
    }

    return Localization.replace(String(translation || source), data);
  }
  testTrans() {
    const l = new Localization("fr-fr");
    l.loadTranslations();
    console.log(l.t("landing.login.label"));
  }
}

export default Localization;