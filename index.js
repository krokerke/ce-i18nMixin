export const i18nMixin = ParentClass =>
  class extends ParentClass {
    constructor() {
      super();

      const self = this;

      /**
       * Getter/Setter for language-property
       *
       * @fires language-change
       */
      Object.defineProperty(this.i18n, "language", {
	      configurable: true,
        get() {
          return document.documentElement.lang;
        },
        set(value) {
          document.documentElement.lang = value;
          self.requestUpdate();
          window.dispatchEvent(
            new CustomEvent("i18n-change", { detail: value })
          );
        }
      });
    }

    /**
     * Object containing translations based on simple strings
     * Language Keys can be like 'en', 'en-GB', or any other
     * values are strings or array [string, object]
     * where object contains properties to match (e.g. gender/count/...)
     * property 'count' is special and checks for minium instead of exact match
     */
    static get translations() {
      return {};
    }

    /**
     * Translate given string
     *
     * @param {string} name - key of the translation
     * @param {object} params - params to be replaced or to match translations
     * property 'count' is special and checks for minium instead of exact match
     *
     * @returns {string} translated key
     */
    i18n(name, params) {
      const translations = this.constructor.translations[this.i18n.language];

      // Fallback to used key, when no translation was found
      if (translations === undefined || translations[name] === undefined) {
        return name;
      }

      const translation = translations[name];

      // Replace all params marked with '%{PARAM}'
      const replaceParams = (text, params) => {
        return params === undefined
          ? text
          : Object.keys(params).reduce((acc, key) => {
              return acc.replace(
                new RegExp(`%{${key}}`, "g"),
                key === "count" ? Math.abs(params[key]) : params[key]
              );
            }, text);
      };

      // Has additional matches to check
      if (Array.isArray(translation) && translation.length) {
        const found = translation.reverse().find(([_, matches]) => {
          return !Object.keys(matches)
            .map(key => {
              if (matches[key] === undefined) {
                return true;
              }

              // if key is 'count', check minimum instead of exact match
              if (key === "count" && isFinite(params[key])) {
                return params[key] >= 0
                  ? params[key] >= matches[key]
                  : params[key] <= matches[key];
              }

              // Check for exact match in params
              return this.i18n(matches[key]) === this.i18n(params[key]);
            })
            .some(a => !a);
        });

        return found ? replaceParams(found[0], params) : name;
      }

      // Basic translation without additional matches
      return replaceParams(translation, params);
    }
  };
