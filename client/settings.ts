// cannot store boolean in localStorage
export interface SettingsInterface {
    frequencyBasedMarker: string;
    frequencyBasedLine: string;
    militaryClock: string;
    metricUnits: string;
}

const defaultSettings: SettingsInterface = {
    frequencyBasedMarker: "false",
    frequencyBasedLine: "false",
    militaryClock: "true",
    metricUnits: "true"
}

export function initiateSettings() {
    for(let key in defaultSettings) {
        const current = localStorage.getItem(key);

        if(current === null) {
            localStorage.setItem(key, defaultSettings[key]);
        }
    }
}
