class ContentCardExample extends HTMLElement {
    // Whenever the state changes, a new `hass` object is set. Use this to
    // update your content.
  set hass(hass) {
      const entityId = this.config.entity;
      const poolDetailObj = hass.states["sensor.pool_detail"];
      const state = hass.states[entityId];
      const stateStr = state ? state.state : "unavailable";

      // Initialize the content if it's not there yet.
      if (!this.content) {
        this.innerHTML = `
          <ha-card>
            <div class="card-content" style="padding:0px;" ></div>
          </ha-card>
        `;
        this.content = this.querySelector("div");
      }



      this.content.innerHTML = `
      <style>
      .poolCard {
        display:flex;
        flex-direction:column;
        justify-content: space-between;
        border-radius: 12px;
        min-height: 400px;
      }
      .poolCard:before {
        content: "";
        position: absolute;
        top: 0px;
        right: 0px;
        bottom: 0px;
        left: 0px;
        background-color: rgba(255,255,255,0.1);
      }

      .poolCardTitle {
        display: flex;
        justify-content: space-between;
        width:100%;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 12px 12px 0px 0px;
        height: 25px;
      }
      .zoneNom {
        display: flex;
        align-self: center;
        padding-left: 12px;
        color:#FFFFFF;
        font-size: 16px;
        font-weight: 400;
        width: 100%;
      }
      .zoneTemperature {
        display: flex;
        align-self: center;
        justify-content:center;
        color:#FFFFFF;
        font-size: 22px;
        font-weight: 400;
        width: 100%;
      }
      .zoneVolume {
        display: flex;
        align-self: center;
        justify-content:right;
        padding-right: 12px;
        color:#FFFFFF;
        font-size: 16px;
        font-weight: 400;
        width: 100%;
      }
      .poolCardBottom {
        display: flex;
        justify-content: space-between;
        width:100%;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 0px 0px 12px 12px;
        height: 100px;
      }
    </style>
        <div class="poolCard" style="background-image: url(http://easycare.waterair.com/${poolDetailObj.attributes.pool_custom_photo})">
          <div class="poolCardTitle">
            <div class="zoneNom">${poolDetailObj.state}</div>
            <div class="zoneTemperature">13°C</div>
            <div class="zoneVolume">${poolDetailObj.attributes.pool_volume}m3</div>
          </div>

          <div class="poolCardBottom">
          </div>
        </div>


      `;
    }

    // The user supplied configuration. Throw an exception and Home Assistant
    // will render an error card.
    setConfig(config) {
      if (!config.entity) {
        throw new Error("You need to define an entity");
      }
      this.config = config;
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
      return 3;
    }

    renderStyle() {
      return html`
        <style>
          .poolCard:before {
            content: "";
            position: absolute;
            top: 0px;
            right: 0px;
            bottom: 0px;
            left: 0px;
            background-color: rgba(0,0,0,0.25);
          }
        </style>
        `;
    }
  }

  customElements.define("content-card-example", ContentCardExample);