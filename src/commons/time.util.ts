import { DateTime } from "luxon";

export const generateCurrentTime = () => {
  return new Date();
}

// https://stackoverflow.com/questions/15141762/how-to-initialize-a-javascript-date-to-a-particular-time-zone
export const convertExpectedTime = (date: Date) => {
  const initialTime = DateTime.fromJSDate(date, {zone: "America/Los_Angeles"}).plus({hour: 22}).toUTC().toISO();
  return DateTime.fromISO(initialTime.replace("Z", ""), {zone: "America/Los_Angeles"}).toUTC().toJSDate();
}