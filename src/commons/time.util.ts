import { DateTime } from "luxon";

export const generateCurrentTime = () => {
  return new Date();
}

// https://stackoverflow.com/questions/15141762/how-to-initialize-a-javascript-date-to-a-particular-time-zone
export const convertLocalExpected = (date: Date, offset: number) => {
  const initialTime = DateTime.fromJSDate(date, {zone: "America/Los_Angeles"}).plus({hour: offset}).toUTC().toISO();
  return DateTime.fromISO(initialTime.replace("Z", ""), {zone: "America/Los_Angeles"}).toUTC().toJSDate();
}

export const convertLocalStart = () => {
  return DateTime.local().setZone("America/Los_Angeles").startOf("day").toUTC().toJSDate();
}

export const convertLocalEnd = () => {
  return DateTime.local().setZone("America/Los_Angeles").endOf("day").toUTC().toJSDate();
}