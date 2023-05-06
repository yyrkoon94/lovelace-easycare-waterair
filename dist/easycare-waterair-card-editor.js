const fireEvent = (node, type, detail, options) => {
    options = options || {};
    detail = detail === null || detail === undefined ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
};

const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// First we get an entities card element
const cardHelpers = await window.loadCardHelpers();
const entitiesCard = await cardHelpers.createCardElement({ type: "entities", entities: [] }); // A valid config avoids errors

// Then we make it load its editor through the static getConfigElement method
entitiesCard.constructor.getConfigElement();

class EasyCareCardEditor extends LitElement {

    constructor() {
        super(...arguments);
        this._configArray = [];
    }

    setConfig(config) {
      this._config = { ...config };
    }

    static get properties() {
        return { hass: {}, _config: {} };
    }

    get _poolConnectionEntity() {
      return this._config.poolConnectionEntity || "";
    }

    get _poolDetailEntity() {
        return this._config.poolDetailEntity || "";
    }

    get _poolTemperatureEntity() {
      return this._config.poolTemperatureEntity || "";
    }

    get _poolPhEntity() {
      return this._config.poolPhEntity || "";
    }

    get _poolChlorineEntity() {
      return this._config.poolChlorineEntity || "";
    }

    render() {
        if (!this.hass) {
          return html``;
        }

        return html`
            <div class="card-config">
                <div class="side-by-side">
                    <ha-entity-picker
                      label="Pool Connection Entity"
                      .hass="${this.hass}"
                      .value="${this._poolConnectionEntity}"
                      .configValue=${"poolConnectionEntity"}
                      @value-changed="${this._valueChanged}"
                      ></ha-entity-picker>
                    <ha-entity-picker
                        label="Pool Detail Entity"
                        .hass="${this.hass}"
                        .value="${this._poolDetailEntity}"
                        .configValue=${"poolDetailEntity"}
                        @value-changed="${this._valueChanged}"
                        ></ha-entity-picker>
                    <ha-entity-picker
                        label="Pool Temperature"
                        .hass="${this.hass}"
                        .value="${this._poolTemperatureEntity}"
                        .configValue=${"poolTemperatureEntity"}
                        @value-changed="${this._valueChanged}"
                        ></ha-entity-picker>
                    <ha-entity-picker
                        label="Pool Ph"
                        .hass="${this.hass}"
                        .value="${this._poolPhEntity}"
                        .configValue=${"poolPhEntity"}
                        @value-changed="${this._valueChanged}"
                        ></ha-entity-picker>
                    <ha-entity-picker
                        label="Pool Chlorine"
                        .hass="${this.hass}"
                        .value="${this._poolChlorineEntity}"
                        .configValue=${"poolChlorineEntity"}
                        @value-changed="${this._valueChanged}"
                        ></ha-entity-picker>
                </div>
          </div>
          `;
    }

    configChanged(newConfig) {
      const event = new Event("config-changed", {
        bubbles: true,
        composed: true,
      });
      event.detail = { config: newConfig };
      this.dispatchEvent(event);
    }

    _valueChanged(ev) {
        if (!this._config || !this.hass) {
          return;
        }
        const target = ev.target;
        if (this[`_${target.configValue}`] === target.value) {
          return;
        }
        if (target.configValue) {
          if (!target.checked && target.value === "") {
            delete this._config[target.configValue];
          } else {
            this._config = {
              ...this._config,
              [target.configValue]: target.checked !== undefined ? target.checked : target.value
            };
          }
        }
        fireEvent(this, "config-changed", { config: this._config });
    }

    static get styles() {
        return css`
            ha-entity-picker {
              display: block;
              margin-bottom: 16px;
            }
            ha-select {
              display: block;
              margin-bottom: 16px;
            }
            ha-textfield {
              display: block;
              margin-bottom: 16px;
            }
            .switch {
              display: flex;
              margin-bottom: 16px;
              margin-top: 16px;
              justify-content: space-around;
            }
        `;
    }
}


customElements.define("easycare-card-editor", EasyCareCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
    type: "easy-care-card",
    name: "EasyCare for Waterair Card",
    preview: false, // Optional - defaults to false
    description: "Card to display Pool with EasyCare by Waterair", // Optional
});