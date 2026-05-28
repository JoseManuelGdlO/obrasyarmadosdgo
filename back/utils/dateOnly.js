const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const toLocalDateOnlyString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const todayDateOnly = () => toLocalDateOnlyString(new Date());

const normalizeDateOnly = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const str = String(value).trim();
  if (str === "") return null;
  if (DATE_ONLY_RE.test(str)) return str;
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return null;
  return toLocalDateOnlyString(date);
};

module.exports = {
  DATE_ONLY_RE,
  toLocalDateOnlyString,
  todayDateOnly,
  normalizeDateOnly,
};
