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

//   static detectLanguage() {
//     return navigator.language || "en-US";
//   }

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
    this.lang = lang;
	console.log("The language is = ");
	console.log(this.lang);
    this.translation = null;  // Initialisé à null
    this.source = null;  // Initialisé à null
	this.loadTranslations();
    // this.isLoaded = false; // Indicateur de chargement des traductions
  }

  async loadTranslations() {
    const path = Localization._getTLPath(this.lang); // Chemin basé sur la langue
    this.translation = await Localization._load(path);
	if (!this.translation)
		console.log("ERROR FETCHING TRANSLATION");
	this.source = await Localization._load(pathEn); // Chargement de l'anglais par défaut
    this.isLoaded = true;  // Indicateur mis à jour
	if (!this.isLoaded)
		console.log("ERROR LOADING TRANSLATION");
  }

  async t(flatkey, data) {
    // Si les traductions ne sont pas chargées, attendre qu'elles le soient
    if (!this.isLoaded) {
      await this.loadTranslations();  // Attendre ici
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

    // Si la traduction n'existe pas, retourner la valeur de source (en anglais)
    return Localization.replace(String(translation || source), data);
  }
  testTrans() {
    // console.log("Langue détectée :", Localization.detectLanguage());
    const l = new Localization("fr-fr");
    l.loadTranslations(); // Charger les traductions
    console.log(l.t("landing.login.label"));
  }
}

export default Localization;

//


// const pathEn = '../../local/en-us/translation.json';
// const pathFr = '../../local/fr-fr/translation.json';
// const pathEs = '../../local/es-es/translation.json';

// class Localization {
//   static async _load(path = pathEn) {
//     let obj = {};
//     try {
//       const response = await fetch(path);
// 	  if (response === false)
// 		console.log("ERROR FETCHING FILE");
// 	  else
// 	  	console.log("FILE FETCHED");
//       obj = await response.json();
//     } catch (e) {
//       console.log("Error in the translation file", e);
//     }
//     return obj;
//   }

//   static replace(value, data) {
//     if (!value || !data) return value;
//     for (const property in data) {
//       value = value.replace(`{{${property}}}`, String(data[property]));
//     }
//     return value;
//   }

// //   static detectLanguage() {
// //     return navigator.language || "en-us";
// //   }

//   static _getTLPath(lang) {
//     if (lang === 'fr-fr') {
//       return pathFr;
//     } else if (lang === 'es-es') {
//       return pathEs;
//     } else {
//       return pathEn;
//     }
//   }

//   constructor(lang) {
//     this.lang = lang;
// 	console.log("The language is = ");
// 	console.log(this.lang);
//     this.translation = {}; // Initialisation vide
//     this.source = {}; // Initialisation vide
//     this.isLoaded = false; // Ajouter un état pour savoir si les traductions sont chargées
//     this.loadTranslations(); // Charger les traductions dès le début
// 	this.testTrans();
//   }

//   async loadTranslations() {
//     const path = Localization._getTLPath(this.lang);
//     this.translation = await Localization._load(path);
// 	if (!this.translation)
// 		console.log("ERROR FETCHING TRANSLATION");
//     this.source = await Localization._load(pathEn); // Chargement de la version anglaise
//     this.isLoaded = true; // Les traductions sont maintenant chargées
//   }

//   async t(flatkey, data) {
//     // Attendre que les traductions soient chargées
//     if (!this.isLoaded) {
//       await this.loadTranslations(); // Attente explicite de la fin du chargement
//     }

//     const keys = flatkey.split(".");
//     let translation = this.translation;
//     let source = this.source;
//     let i = 0;

//     while (translation !== undefined && source !== undefined && i < keys.length) {
//       const key_ = keys[i++];
//       if (translation) translation = translation[key_];
//       if (source) source = source[key_];
//     }

//     return Localization.replace(String(translation || source), data);
//   }

//   testTrans() {
//     // console.log("Langue détectée :", Localization.detectLanguage());
//     const l = new Localization();
//     l.loadTranslations(); // Charger les traductions
//     console.log(l.t("landing.login.label"));
//   }
// }

// export default Localization;

