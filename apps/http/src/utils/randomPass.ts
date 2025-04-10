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

/**
 * Generate a random password with specified characteristics
 * @param length Password length (default: 12)
 * @returns A random password string
 */
export const generateRandomPassword = (length: number = 12): string => {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*()_-+=<>?';

    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

    // Ensure at least one of each character type
    let password =
        uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length)) +
        lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length)) +
        numberChars.charAt(Math.floor(Math.random() * numberChars.length)) +
        specialChars.charAt(Math.floor(Math.random() * specialChars.length));

    // Fill the rest of the password
    for (let i = 4; i < length; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password
    return password
        .split('')
        .sort(() => 0.5 - Math.random())
        .join('');
};