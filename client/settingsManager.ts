// cannot store boolean in localStorage
export interface SettingsInterface {
    frequencyBasedMarker: string;
    frequencyBasedLine: string;
    //militaryClock: string;
    metricUnits: string;
}
const SettingsKeys = ["frequencyBasedMarker", "frequencyBasedLine", /*"militaryClock",*/ "metricUnits"];
type Setting = typeof SettingsKeys[number];

const defaultSettings: SettingsInterface = {
    frequencyBasedMarker: "false",
    frequencyBasedLine: "false",
    //militaryClock: "true",
    metricUnits: "true"
}

class SettingsManagerClass {
    SettingsManager() {
        for(let key of SettingsKeys) {
            const current = localStorage.getItem(key);

            if(current === null) {
                localStorage.setItem(key, defaultSettings[key]);
            }
        }
    }

    getSetting(setting: Setting): string|null {
        return localStorage.getItem(setting);
    }

    getAllSettings(): SettingsInterface {
        var settings: SettingsInterface = defaultSettings;

        for(let key of SettingsKeys) {
            settings[key] = this.getSetting(key);
        }

        return settings;
    }

    setSetting(setting: Setting, value: string): void {
        localStorage.setItem(setting, value)
    }
}
export const SettingsManager = new SettingsManagerClass();
