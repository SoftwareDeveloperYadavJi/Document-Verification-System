import { randomBytes } from "crypto";

/**
 * Generates a random password of a specified length.
 * @param length - The length of the password to generate.
 * @returns A random password string of the specified length.
 */
export const generateRandomPasswordWithLength = (length: number) => {
    const randomBytesArray = randomBytes(length);
    const randomString = randomBytesArray.toString("hex");
    return randomString;
}