const translations = {};

const pathEn = "../../local/en-us/translation.json";
const pathFr = "../../local/fr-fr/translation.json";
const pathEs = "../../local/es-es/translation.json";
const pathIt = "../../local/it-it/translation.json";

class Localization {
  constructor(lang) {
    this.lang = Localization.detectLanguage();
    this.translation = null;
    this.source = null;
    // this.loadTranslations();
  }

  static detectLanguage() {
    return navigator.language || "en-us";
  }

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

  static _getTLPath(lang) {
    if (lang === "fr-fr") {
      return pathFr;
    } else if (lang === "es-es") {
      return pathEs;
    } else if (lang == "it-it") {
      return pathIt;
    } else {
      return pathEn;
    }
  }

  async loadTranslations() {
    if (translations[this.lang]) {
      this.translation = translations[this.lang];
    } else {
      const path = Localization._getTLPath(this.lang);
      this.translation = await Localization._load(path);
      translations[this.lang] = this.translation;
    }
    if (this.lang !== "en-us" && !translations["en-us"]) {
      translations["en-us"] = await Localization._load(pathEn);
    }
    this.source = translations["en-us"];

    this.isLoaded = this.translation !== null && this.source !== null;
    if (!this.isLoaded) console.log("Error loading translation");
  }

  // async loadTranslations() {
  //   const path = Localization._getTLPath(this.lang);
  //   this.translation = await Localization._load(path);
  //   if (!this.translation) console.log("Error fetching translation file");
  //   this.source = await Localization._load(pathEn);
  //   this.isLoaded = true;
  //   if (!this.isLoaded) console.log("Error loading translation");
  // }

  async t(flatkey, data) {
    if (!this.isLoaded) await this.loadTranslations();
    const keys = flatkey.split(".");
    let translation = this.translation;
    let source = this.source;
    let i = 0;

    while (
      translation !== undefined &&
      source !== undefined &&
      i < keys.length
    ) {
      const key_ = keys[i++];
      if (translation) translation = translation[key_];
      if (source) source = source[key_];
    }

    return Localization.replace(String(translation || source), data);
  }

  static replace(value, data) {
    if (!value || !data) return value;
    for (const property in data) {
      value = value.replace(`{{${property}}}`, String(data[property]));
    }
    return value;
  }
}

export default Localization;