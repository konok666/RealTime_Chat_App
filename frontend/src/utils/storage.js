export const saveChats = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};
export const loadChats = (key, defaultValue = null) => {
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};
