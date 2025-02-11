export function objectFromForm(event) {
    let object = Object.fromEntries(new FormData(event.currentTarget));
    object = Object.fromEntries(Object.entries(object).filter(([_, v]) => v != ""));

    if (Object.keys(object).length === 0) {
        return null;
    }

    return object;
}
