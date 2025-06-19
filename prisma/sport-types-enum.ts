import z from "zod";

export enum SportType {
  FOOTBALL = "FOOTBALL",
  BASKETBALL = "BASKETBALL",
  VOLLEYBALL = "VOLLEYBALL",
  /*
  BASEBALL = "BASEBALL",
  AMERICAN_FOOTBALL = "AMERICAN_FOOTBALL",
  HOCKEY = "HOCKEY",
  TENNIS = "TENNIS",
  RUGBY = "RUGBY",
  CRICKET = "CRICKET",
  OTHER = "OTHER"*/
}

export const SportTypeSchema = z.nativeEnum(SportType);