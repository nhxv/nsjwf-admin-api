import { DateTime } from "luxon";

export const generateCurrentTime = () => {
  return new Date();
};

// https://stackoverflow.com/questions/15141762/how-to-initialize-a-javascript-date-to-a-particular-time-zone
export const convertLocalExpected = (date: Date) => {
  const initialTime = DateTime.fromJSDate(date, { zone: "America/Los_Angeles" })
    .toUTC()
    .endOf("day")
    .toISO();
  return DateTime.fromISO(initialTime.replace("Z", ""), {
    zone: "America/Los_Angeles",
  })
    .toUTC()
    .toJSDate();
};

export const convertLocalStart = () => {
  return DateTime.local()
    .setZone("America/Los_Angeles")
    .startOf("day")
    .toUTC()
    .toJSDate();
};

export const convertLocalEnd = () => {
  return DateTime.local()
    .setZone("America/Los_Angeles")
    .endOf("day")
    .toUTC()
    .toJSDate();
};

export const convertLocalInterval = (date: Date) => {
  const startDay = DateTime.fromJSDate(date, { zone: "America/Los_Angeles" })
    .toUTC()
    .startOf("day")
    .toISO();
  const endDay = DateTime.fromJSDate(date, { zone: "America/Los_Angeles" })
    .toUTC()
    .endOf("day")
    .toISO();
  return {
    start: DateTime.fromISO(startDay.replace("Z", ""), {
      zone: "America/Los_Angeles",
    })
      .toUTC()
      .toJSDate(),
    end: DateTime.fromISO(endDay.replace("Z", ""), {
      zone: "America/Los_Angeles",
    })
      .toUTC()
      .toJSDate(),
  };
};

export const convertLocalWeekStart = () => {
  return DateTime.local()
    .setZone("America/Los_Angeles")
    .startOf("week")
    .toUTC()
    .toJSDate();
};

export const convertLocalWeekEnd = () => {
  return DateTime.local()
    .setZone("America/Los_Angeles")
    .endOf("week")
    .toUTC()
    .toJSDate();
};

export const convertLocalMonthStart = () => {
  return DateTime.local()
    .setZone("America/Los_Angeles")
    .startOf("month")
    .toUTC()
    .toJSDate();
};

export const convertLocalMonthEnd = () => {
  return DateTime.local()
    .setZone("America/Los_Angeles")
    .endOf("month")
    .toUTC()
    .toJSDate();
};
