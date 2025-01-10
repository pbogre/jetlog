// cannot store boolean in localStorage
export interface ConfigInterface {
    frequencyBasedMarker: string;
    frequencyBasedLine: string;
    //militaryClock: string;
    metricUnits: string;
    darkMode: string;
}
const ConfigKeys = ["frequencyBasedMarker", "frequencyBasedLine", /*"militaryClock",*/ "metricUnits", "darkMode"];
type Config = typeof ConfigKeys[number];

const defaultConfig: ConfigInterface = {
    frequencyBasedMarker: "false",
    frequencyBasedLine: "false",
    //militaryClock: "true",
    metricUnits: "true",
    darkMode: "false"
}

class ConfigStorageClass {
    constructor() {
        for(let key of ConfigKeys) {
            const current = localStorage.getItem(key);

            if(current === null) {
                localStorage.setItem(key, defaultConfig[key]);
            }
        }
    }

    getSetting(setting: Config): string|null {
        return localStorage.getItem(setting);
    }

    setSetting(setting: Config, value: string) {
        localStorage.setItem(setting, value);
        
        // Apply dark mode immediately when changed
        if (setting === "darkMode") {
            if (value === "true") {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }

    getAllSettings(): ConfigInterface {
        let settings: any = {};
        for(let key of ConfigKeys) {
            settings[key] = this.getSetting(key);
        }
        return settings;
    }
}

const ConfigStorage = new ConfigStorageClass();

// Initialize dark mode on load
const darkMode = ConfigStorage.getSetting("darkMode");
if (darkMode === "true") {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

export default ConfigStorage;
